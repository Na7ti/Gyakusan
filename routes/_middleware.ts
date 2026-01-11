import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";
import { withDb } from "$/db/client.ts";

export interface State {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>,
) {
  const url = new URL(req.url);
  
  // Skip auth check for login page, auth APIs, and static assets
  if (
    url.pathname === "/login" || 
    url.pathname.startsWith("/api/auth") || 
    url.pathname.startsWith("/static") ||
    url.pathname.startsWith("/_frsh")
  ) {
    return await ctx.next();
  }

  const cookies = getCookies(req.headers);
  const authToken = cookies.auth_token;

  if (authToken) {
    // Fetch real user from DB
    const user = await withDb(async (client) => {
      const res = await client.queryObject`
        SELECT google_id as id, email FROM users WHERE google_id = ${authToken}
      `;
      return res.rows[0] as State["user"];
    });

    if (user) {
      ctx.state.user = user;
      return await ctx.next();
    }
  }

  // Redirect to login if not authenticated
  return new Response(null, {
    status: 303,
    headers: { location: "/login" },
  });
}
