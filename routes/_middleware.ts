import { FreshContext } from "$fresh/server.ts";
import { getCookies } from "https://deno.land/std@0.216.0/http/cookie.ts";

interface User {
  id: string;
  name: string;
  email: string;
}

export interface State {
  user?: User;
}

export async function handler(
  req: Request,
  ctx: FreshContext<State>,
) {
  const url = new URL(req.url);
  
  // Skip auth check for login page and static assets
  if (url.pathname === "/login" || url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/static")) {
    return await ctx.next();
  }

  const cookies = getCookies(req.headers);
  const authToken = cookies.auth_token;

  if (authToken === "mock_token_123") {
    ctx.state.user = {
      id: "mock_user_id",
      name: "Mock User",
      email: "mock@example.com",
    };
  } else {
    // Redirect to login if not authenticated
    // For now, simple redirect. 
    // In production, might want to check if it's an API call or page load.
    if (!url.pathname.startsWith("/_fresh")) {
        return new Response(null, {
            status: 303,
            headers: { location: "/login" },
        });
    }
  }

  return await ctx.next();
}
