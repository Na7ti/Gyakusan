import { Handlers } from "$fresh/server.ts";
import { setCookie } from "https://deno.land/std@0.216.0/http/cookie.ts";

export const handler: Handlers = {
  POST(req) {
    const url = new URL(req.url);
    const headers = new Headers();
    
    setCookie(headers, {
      name: "auth_token",
      value: "mock_token_123",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      httpOnly: true, // Secure cookie not accessible by JS
      sameSite: "Lax",
    });

    headers.set("location", "/");
    
    return new Response(null, {
      status: 303, // See Other
      headers,
    });
  },
};
