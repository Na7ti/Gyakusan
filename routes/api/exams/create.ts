import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";
import { generateSchedule } from "$/utils/calculator.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";

export const handler: Handlers = {
  async POST(req) {
    const cookies = getCookies(req.headers);
    // TODO: Validate auth cookie in middleware, but here just assume it exists or use mock user
    // For now, hardcode user_id or fetch from session (mocked)
    // In real app, we get user_id from session info.
    // Let's assume user_id = 1 for now if mock auth is active, or we need to insert a user first?
    
    // We haven't inserted a user yet.
    // Let's ensure a user exists or handle this in db/client helper.
    // For MVP/Mock, let's just insert with user_id=null (if nullable?) -> My schema has user_id REFERENCES users(id).
    // So I MUST have a user.
    
    // Let's first ensure we have a user.
    const userId = await withDb(async (client) => {
        // Check if mock user exists, if not create
        const result = await client.queryObject`SELECT id FROM users WHERE google_id='mock_user_id'`;
        if (result.rows.length > 0) {
            return (result.rows[0] as any).id;
        } else {
            const insert = await client.queryObject`
                INSERT INTO users (google_id, email, access_token) 
                VALUES ('mock_user_id', 'mock@example.com', 'mock_token') 
                RETURNING id`;
            return (insert.rows[0] as any).id;
        }
    });

    const form = await req.formData();
    const title = form.get("title") as string;
    const examDateStr = form.get("exam_date") as string;
    const targetPagesStr = form.get("target_pages") as string;

    if (!title || !examDateStr || !targetPagesStr) {
      return new Response("Missing fields", { status: 400 });
    }

    const examDate = new Date(examDateStr);
    const targetPages = parseInt(targetPagesStr);
    const startDate = new Date(); // Start from today

    const schedule = generateSchedule(startDate, examDate, targetPages);

    await withDb(async (client) => {
      try {
        await client.queryArray("BEGIN");

        // Insert Exam
        const examResult = await client.queryObject`
          INSERT INTO exams (user_id, title, exam_date, target_pages)
          VALUES (${userId}, ${title}, ${examDate}, ${targetPages})
          RETURNING id
        `;
        const examId = (examResult.rows[0] as any).id;

        // Insert Tasks
        // Deno Postgres doesn't support bulk insert nicely with tagged templates in older versions,
        // but we can loop or construct a string. Since schedule is limited (~365 days), looping is "okay" for MVP but slow.
        // Let's do a loop for simplicity now.
        for (const task of schedule) {
            await client.queryArray`
                INSERT INTO tasks (exam_id, title, due_date, description)
                VALUES (${examId}, ${`Task for ${task.date.toISOString().split('T')[0]}`}, ${task.date}, ${`Target: ${task.target} pages (Total: ${task.cumulative})`})
            `;
        }

        await client.queryArray("COMMIT");
      } catch (e) {
        await client.queryArray("ROLLBACK");
        throw e;
      }
    });

    // Redirect to dashboard
    const headers = new Headers();
    headers.set("location", "/");
    return new Response(null, {
      status: 303,
      headers,
    });
  },
};
