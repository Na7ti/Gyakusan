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
        const result = await client.queryObject`SELECT id FROM users WHERE google_id=${authToken}`;
        if (result.rows.length === 0) throw new Error("User not found");
        return (result.rows[0] as any).id;
    });

    const calendar = new GoogleCalendarClient(authToken);

    const form = await req.formData();
    const title = form.get("title") as string;
    const examDateStr = form.get("exam_date") as string;
    const targetPagesStr = form.get("target_pages") as string;
    
    const regStartStr = form.get("registration_start_date") as string;
    const regEndStr = form.get("registration_end_date") as string;
    const paymentDeadlineStr = form.get("payment_deadline") as string;

    if (!title || !examDateStr || !targetPagesStr) {
      return new Response("Missing fields", { status: 400 });
    }

    const examDate = new Date(examDateStr);
    const targetPages = parseInt(targetPagesStr);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const schedule = generateSchedule(startDate, examDate, targetPages);

    await withDb(async (client) => {
      try {
        await client.queryArray("BEGIN");

        const examResult = await client.queryObject`
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
        const examId = (examResult.rows[0] as any).id;

        const allTasks = [];

        // Add Important Dates
        if (regStartStr) allTasks.push({ title: '📝 出願開始日', date: regStartStr, desc: '試験の出願受付が開始されます。' });
        if (regEndStr) allTasks.push({ title: '⚠️ 出願締切日', date: regEndStr, desc: '試験の出願締切日です。お忘れなく！' });
        if (paymentDeadlineStr) allTasks.push({ title: '💳 支払期限', date: paymentDeadlineStr, desc: '受験料の支払い期限です。' });
        allTasks.push({ title: '🎉 試験当日', date: examDateStr, desc: `頑張りましょう！ (${title})` });

        // Add Study Tasks
        for (const task of schedule) {
          allTasks.push({
            title: `Task: ${task.target} items`,
            date: task.date.toISOString().split('T')[0],
            desc: `Target quota for today. Cumulative total: ${task.cumulative}`
          });
        }

        for (const task of allTasks) {
          // 1. Sync to Google Calendar
          let calendarEventId = null;
          try {
            const event = await calendar.createEvent({
              summary: `${task.title} [Gyakusan]`,
              description: task.desc,
              start: { date: task.date },
              end: { date: task.date }, // All day event
            });
            calendarEventId = event.id;
          } catch (err) {
            console.error("Failed to sync task to calendar", err);
          }

          // 2. Save to DB
          await client.queryArray`
            INSERT INTO tasks (exam_id, title, due_date, description, calendar_event_id)
            VALUES (${examId}, ${task.title}, ${task.date}, ${task.desc}, ${calendarEventId})
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
