import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";
import { GoogleCalendarClient } from "$/utils/google_calendar.ts";
import { State } from "../../../_middleware.ts";

export const handler: Handlers<any, State> = {
  async POST(req, ctx) {
    const taskId = ctx.params.id;
    const body = await req.json();
    const isCompleted = body.is_completed;
    const user = ctx.state.user;

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    await withDb(async (client) => {
      // 1. Update the original task
      await client.queryArray`
        UPDATE tasks 
        SET is_completed = ${isCompleted} 
        WHERE id = ${taskId}
      `;

      if (isCompleted) {
        // 2. Create review tasks (1, 7, 16 days later)
        const taskRes = await client.queryObject<{ title: string; due_date: Date; exam_id: number }>`
          SELECT title, due_date, exam_id FROM tasks WHERE id = ${taskId}
        `;
        const originalTask = taskRes.rows[0];
        const calendar = new GoogleCalendarClient(user.id);

        const intervals = [1, 7, 16];
        for (const interval of intervals) {
          const reviewDate = new Date(originalTask.due_date);
          reviewDate.setDate(reviewDate.getDate() + interval);
          const reviewDateStr = reviewDate.toISOString().split("T")[0];
          const reviewTitle = `🔄【復習】${originalTask.title}`;

          // Create in DB
          const insertRes = await client.queryObject<{ id: number }>`
            INSERT INTO tasks (exam_id, title, due_date, review_for_task_id)
            VALUES (${originalTask.exam_id}, ${reviewTitle}, ${reviewDateStr}, ${taskId})
            RETURNING id
          `;
          const newTaskId = insertRes.rows[0].id;

          // Sync to Google Calendar
          try {
            const event = await calendar.createEvent({
              summary: reviewTitle,
              description: `忘却曲線に基づいた復習タスクです。元のタスク: ${originalTask.title}`,
              start: { date: reviewDateStr },
              end: { date: reviewDateStr },
            });
            
            await client.queryArray`
              UPDATE tasks SET calendar_event_id = ${event.id} WHERE id = ${newTaskId}
            `;
          } catch (e) {
            console.error("Failed to sync review task to calendar:", e);
          }
        }
      } else {
        // 3. Delete associated review tasks
        const reviewsRes = await client.queryObject<{ id: number; calendar_event_id: string }>`
          SELECT id, calendar_event_id FROM tasks WHERE review_for_task_id = ${taskId}
        `;
        const calendar = new GoogleCalendarClient(user.id);

        for (const review of reviewsRes.rows) {
          if (review.calendar_event_id) {
            try {
              await calendar.deleteEvent(review.calendar_event_id);
            } catch (e) {
              console.error("Failed to delete review event from calendar:", e);
            }
          }
          await client.queryArray`DELETE FROM tasks WHERE id = ${review.id}`;
        }
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
