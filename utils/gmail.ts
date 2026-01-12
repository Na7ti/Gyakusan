import { withDb } from "$/db/client.ts";

export class GmailClient {
  private clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  private clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  constructor(private userId: string) {}

  private async getTokens() {
    return await withDb(async (client) => {
      const res = await client.queryObject`
        SELECT access_token, refresh_token FROM users WHERE google_id = ${this.userId}
      `;
      return res.rows[0] as { access_token: string; refresh_token: string };
    });
  }

  private async refreshAccessToken(refreshToken: string) {
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error("Failed to refresh token");

    await withDb(async (client) => {
      await client.queryArray`
        UPDATE users SET access_token = ${data.access_token} WHERE google_id = ${this.userId}
      `;
    });

    return data.access_token;
  }

  async fetchWithAuth(url: string, options: RequestInit = {}) {
    let { access_token, refresh_token } = await this.getTokens();

    const call = async (token: string) => {
      return await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
    };

    let resp = await call(access_token);

    if (resp.status === 401 && refresh_token) {
      access_token = await this.refreshAccessToken(refresh_token);
      resp = await call(access_token);
    }

    return resp;
  }

  async listExamEmails() {
    const q = "subject:(試験 OR 申し込み OR 受験)";
    const resp = await this.fetchWithAuth(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=10`
    );

    if (!resp.ok) return [];

    const data = await resp.json();
    if (!data.messages) return [];

    const exams = [];
    for (const msg of data.messages) {
      const detailResp = await this.fetchWithAuth(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`
      );
      if (!detailResp.ok) continue;

      const detail = await detailResp.json();
      const payload = detail.payload;
      const headers = payload.headers;
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
      const snippet = detail.snippet || "";

      // Simple parsing logic: Extract potential exam name and date
      const dateMatch = snippet.match(/(\d{4})[年/](\d{1,2})[月/](\d{1,2})日?/);
      let date = null;
      if (dateMatch) {
        date = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
      }

      exams.push({
        id: msg.id,
        subject,
        snippet,
        suggestedTitle: subject.replace(/.*(試験|申し込み|受験).*/, "$1").trim() || subject,
        suggestedDate: date,
      });
    }

    return exams;
  }
}
