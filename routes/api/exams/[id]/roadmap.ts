import { Handlers } from "$fresh/server.ts";
import { withDb } from "../../../../db/client.ts";
import { GeminiClient } from "../../../../utils/gemini.ts";

export const handler: Handlers = {
  async POST(_req, ctx) {
    const examId = ctx.params.id;
    const userState = ctx.state.user;

    if (!userState) {
      return new Response("Unauthorized", { status: 401 });
    }

    const gemini = new GeminiClient();
    
    return await withDb(async (db) => {
      try {
        // Get numeric userId from google_id
        const userRes = await db.queryObject<{ id: number }>`
          SELECT id FROM users WHERE google_id = ${userState.id}
        `;
        if (userRes.rowCount === 0) {
          return new Response("User not found", { status: 404 });
        }
        const userId = userRes.rows[0].id;
        // Get exam title
        const examRes = await db.queryObject<{ title: string }>(
          "SELECT title FROM exams WHERE id = $1 AND user_id = $2",
          [examId, userId]
        );

        if (examRes.rowCount === 0) {
          return new Response("Exam not found", { status: 404 });
        }

        const examTitle = examRes.rows[0].title;
        const roadmap = await gemini.generateRoadmap(examTitle);

        // Update exam with roadmap
        await db.queryObject(
          "UPDATE exams SET roadmap = $1 WHERE id = $2 AND user_id = $3",
          [roadmap, examId, userId]
        );

        return new Response(JSON.stringify({ roadmap }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e: any) {
        console.error("Roadmap API error:", e);
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    });
  },
};
