import { Handlers } from "$fresh/server.ts";
import { GmailClient } from "../../../utils/gmail.ts";
import { State } from "../../_middleware.ts";

export const handler: Handlers<any, State> = {
  async GET(_req, ctx) {
    const user = ctx.state.user;
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const gmail = new GmailClient(user.id);
    try {
      const exams = await gmail.listExamEmails();
      return new Response(JSON.stringify({ exams }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      console.error("Gmail scan error:", e);
      return new Response(JSON.stringify({ error: "Gmailスキャンに失敗しました" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
