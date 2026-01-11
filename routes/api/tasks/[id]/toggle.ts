import { Handlers } from "$fresh/server.ts";
import { withDb } from "$/db/client.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    const taskId = ctx.params.id;
    const body = await req.json();
    const isCompleted = body.is_completed;

    await withDb(async (client) => {
      await client.queryArray`
        UPDATE tasks 
        SET is_completed = ${isCompleted} 
        WHERE id = ${taskId}
      `;
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
