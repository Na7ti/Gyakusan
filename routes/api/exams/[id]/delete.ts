import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const cookies = getCookies(req.headers);
    const authToken = cookies.auth_token;
    const examId = ctx.params.id;

    if (!authToken) {
      return new Response("Unauthorized", { status: 401 });
    }

    try {
      await withDb(async (client) => {
        // Ensure the exam belongs to the user
        const checkResult = await client.queryObject<{ id: number }>`
          SELECT id FROM exams 
          WHERE id = ${examId} AND user_id = (SELECT id FROM users WHERE google_id = ${authToken})
        `;

        if (checkResult.rows.length === 0) {
          throw new Error("Exam not found or unauthorized");
        }

        // Delete associated tasks first (due to foreign key constraints if not CASCADE, 
        // though we should use CASCADE in DB schema if possible. Let's be explicit.)
        await client.queryArray`DELETE FROM tasks WHERE exam_id = ${examId}`;
        await client.queryArray`DELETE FROM exams WHERE id = ${examId}`;
      });

      return new Response(null, {
        status: 303,
        headers: { "location": "/" },
      });
    } catch (err) {
      console.error("Failed to delete exam:", err);
      return new Response(err.message, { status: 500 });
    }
  },
};
