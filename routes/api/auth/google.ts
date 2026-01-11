import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const redirectUri = Deno.env.get("REDIRECT_URI");
    
    if (!clientId || !redirectUri) {
      return new Response("Google credentials not configured", { status: 500 });
    }

    const scope = [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" ");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", scope);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");

    return new Response(null, {
      status: 302,
      headers: { location: url.toString() },
    });
  },
};
