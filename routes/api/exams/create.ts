import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";
import { generateSchedule } from "$/utils/calculator.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";
import { GoogleCalendarClient } from "$/utils/google_calendar.ts";

export const handler: Handlers = {
  async POST(req) {
    const cookies = getCookies(req.headers);
    const authToken = cookies.auth_token;

    if (!authToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = await withDb(async (client) => {
        const result = await client.queryObject<{ id: number }>`SELECT id FROM users WHERE google_id=${authToken}`;
        if (result.rows.length === 0) throw new Error("User not found");
        return result.rows[0].id;
    });

    const calendar = new GoogleCalendarClient(authToken);

    const form = await req.formData();
    const replaceIdStr = form.get("replace_id") as string;
    const title = form.get("title") as string;
    const examDateStr = form.get("exam_date") as string;
    const targetPagesStr = form.get("target_pages") as string;
    const startDateStr = form.get("start_date") as string;
    
    const regStartStr = form.get("registration_start_date") as string;
    const regEndStr = form.get("registration_end_date") as string;
    const paymentDeadlineStr = form.get("payment_deadline") as string;

    if (!title || !examDateStr || !targetPagesStr) {
      return new Response("Missing fields", { status: 400 });
    }

    // If replace_id is provided, delete the existing exam first
    if (replaceIdStr) {
      const replaceId = parseInt(replaceIdStr);
      await withDb(async (client) => {
        // Get calendar event IDs before deletion
        const eventsRes = await client.queryObject<{ calendar_event_id: string }>`
          SELECT calendar_event_id FROM tasks 
          WHERE exam_id = ${replaceId} AND calendar_event_id IS NOT NULL
        `;
        
        // Delete events from Google Calendar
        for (const row of eventsRes.rows) {
          if (row.calendar_event_id) {
            try {
              await calendar.deleteEvent(row.calendar_event_id);
            } catch (e) {
              console.error("Failed to delete calendar event:", e);
            }
          }
        }

        // Delete tasks and exam from database
        await client.queryArray`DELETE FROM tasks WHERE exam_id = ${replaceId}`;
        await client.queryArray`DELETE FROM exams WHERE id = ${replaceId} AND user_id = ${userId}`;
      });
    }

    // Use JST for "today" calculation
    const getJstNow = () => {
      const now = new Date();
      const jstOffset = 9 * 60; // JST is UTC+9
      return new Date(now.getTime() + jstOffset * 60 * 1000);
    };

    // Use provided start date or default to today (in JST)
    let startDate: Date;
    if (startDateStr) {
      // startDateStr is "YYYY-MM-DD", specifying the day in JST
      startDate = new Date(startDateStr);
    } else {
      startDate = getJstNow();
    }
    // Set to 00:00 UTC for consistent calculation in generateSchedule
    startDate.setUTCHours(0, 0, 0, 0);

    const examDate = new Date(examDateStr);
    examDate.setUTCHours(0, 0, 0, 0); // Normalize to UTC
    
    const targetPages = parseInt(targetPagesStr);

    const schedule = generateSchedule(startDate, examDate, targetPages);

    // Prepare all tasks list
    const tasksToCreate = [];
    if (regStartStr) tasksToCreate.push({ title: '📝 出願開始日', date: regStartStr, desc: '試験の出願受付が開始されます。' });
    if (regEndStr) tasksToCreate.push({ title: '⚠️ 出願締切日', date: regEndStr, desc: '試験の出願締切日です。お忘れなく！' });
    if (paymentDeadlineStr) tasksToCreate.push({ title: '💳 支払期限', date: paymentDeadlineStr, desc: '受験料の支払い期限です。' });
    tasksToCreate.push({ title: '🎉 試験当日', date: examDateStr, desc: `頑張りましょう！ (${title})` });

    const totalDays = schedule.length;
    for (let i = 0; i < totalDays; i++) {
      const task = schedule[i];
      const dayNum = i + 1;
      const daysLeft = totalDays - dayNum;
      
      // task.date is a Date object. Convert it to "YYYY-MM-DD" string consistently.
      const dateStr = task.date.toISOString().split('T')[0];
      
      tasksToCreate.push({
        title: `📚 勉強: 第${dayNum}日 (残り${daysLeft}日)`,
        date: dateStr,
        desc: `今日の目標: ${task.target} ページ / 累計: ${task.cumulative} ページ`
      });
    }

    // 1. Sync to Google Calendar FIRST (Slow network call)
    // We do this outside the DB transaction to avoid holding the connection.
    const syncedTasks = [];
    for (const task of tasksToCreate) {
      let calendarEventId = null;
      try {
        const event = await calendar.createEvent({
          summary: `[${title}] ${task.title}`,
          description: task.desc,
          start: { date: task.date },
          end: { date: task.date },
        });
        calendarEventId = event.id;
      } catch (err) {
        console.error("Failed to sync task to calendar", err);
      }
      syncedTasks.push({ ...task, calendarEventId });
    }

    // 2. Perform DB ops (Fast)
    await withDb(async (client) => {
      try {
        await client.queryArray("BEGIN");

        const examResult = await client.queryObject<{ id: number }>`
          INSERT INTO exams (
            user_id, title, exam_date, target_pages, 
            registration_start_date, registration_end_date, payment_deadline
          )
          VALUES (
            ${userId}, ${title}, ${examDate}, ${targetPages},
            ${regStartStr || null}, ${regEndStr || null}, ${paymentDeadlineStr || null}
          )
          RETURNING id
        `;
        const examId = examResult.rows[0].id;

        for (const task of syncedTasks) {
          await client.queryArray`
            INSERT INTO tasks (exam_id, title, due_date, description, calendar_event_id)
            VALUES (${examId}, ${task.title}, ${task.date}, ${task.desc}, ${task.calendarEventId})
          `;
        }

        await client.queryArray("COMMIT");
      } catch (e) {
        await client.queryArray("ROLLBACK");
        throw e;
      }
    });

    return new Response(null, {
      status: 303,
      headers: { "location": "/" },
    });
  },
};
