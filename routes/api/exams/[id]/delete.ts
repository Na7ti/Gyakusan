import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";
import { GoogleCalendarClient } from "$/utils/google_calendar.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const cookies = getCookies(req.headers);
    const authToken = cookies.auth_token;
    const examId = ctx.params.id;

    if (!authToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const calendar = new GoogleCalendarClient(authToken);
      let calendarEvents: string[] = [];

      await withDb(async (client) => {
        // 1. Get associated calendar event IDs before cascading delete
        const tasksRes = await client.queryObject<{ calendar_event_id: string }>`
          SELECT calendar_event_id FROM tasks 
          WHERE exam_id = ${examId} AND exam_id IN (
            SELECT id FROM exams WHERE user_id = (SELECT id FROM users WHERE google_id = ${authToken})
          )
        `;

        calendarEvents = tasksRes.rows
          .filter(row => row.calendar_event_id)
          .map(row => row.calendar_event_id!);

        // 2. Delete from DB (CASCADE will handle related tasks)
        // We do this synchronously to ensure the app state is updated immediately.
        const deleteRes = await client.queryArray`
          DELETE FROM exams 
          WHERE id = ${examId} 
          AND user_id = (SELECT id FROM users WHERE google_id = ${authToken})
        `;
        
        if (deleteRes.rowCount === 0) {
          throw new Error("Exam not found or you don't have permission to delete it.");
        }
      });

      // 3. Delete events from Google Calendar in BACKGROUND (Fire-and-forget)
      // This ensures the UI is responsive effectively immediately.
      (async () => {
        try {
          // Use sequential processing to avoid rate limits, but in background it doesn't matter if it's slow.
          for (const eventId of calendarEvents) {
            try {
              await calendar.deleteEvent(eventId);
            } catch (err) {
               // Ignore 404s or 410s (already deleted)
               console.error(`Background delete failed for event ${eventId}:`, err);
            }
          }
          console.log(`Background GCal cleanup completed for exam ${examId}`);
        } catch (e) {
          console.error("Critical error in background GCal cleanup:", e);
        }
      })();

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Failed to delete exam:", err);
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },
};
