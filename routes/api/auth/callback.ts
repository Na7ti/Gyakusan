import { Handlers } from "$fresh/server.ts";
import { setCookie } from "https://deno.land/std@0.216.0/http/cookie.ts";
import { withDb } from "$/db/client.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) return new Response("No code provided", { status: 400 });

    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const redirectUri = Deno.env.get("REDIRECT_URI");

    // 1. Exchange code for tokens
    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri!,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await resp.json();
    if (!resp.ok) return new Response(JSON.stringify(tokens), { status: 500 });

    // 2. Get user info
    const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userResp.json();

    // 3. Upsert user and tokens in DB
    await withDb(async (client) => {
      await client.queryArray`
        INSERT INTO users (google_id, email, access_token, refresh_token)
        VALUES (${userInfo.id}, ${userInfo.email}, ${tokens.access_token}, ${tokens.refresh_token})
        ON CONFLICT (google_id) DO UPDATE SET
          email = EXCLUDED.email,
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, users.refresh_token)
      `;
    });

    // 4. Set session cookie (simplification: use google_id as token for MVP)
    const headers = new Headers({ location: "/" });
    setCookie(headers, {
      name: "auth_token",
      value: userInfo.id,
      path: "/",
      httpOnly: true,
    });

    return new Response(null, {
      status: 303,
      headers,
    });
  },
};
