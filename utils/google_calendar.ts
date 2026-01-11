import { withDb } from "$/db/client.ts";

export class GoogleCalendarClient {
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
    if (!resp.ok) throw new Error("Failed to refresh token: " + JSON.stringify(data));

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

  async createEvent(event: {
    summary: string;
    description: string;
    start: { date: string };
    end: { date: string };
  }) {
    const resp = await this.fetchWithAuth(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }
    );

    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(`Failed to create event: ${error}`);
    }

    return await resp.json();
  }
}
