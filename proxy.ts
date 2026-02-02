import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie name must match the one in auth-actions.ts
const SESSION_COOKIE_NAME = "dash_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /dash routes
  if (pathname.startsWith("/dash")) {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    // Pass auth status to the page via header
    // This allows the page to render immediately without client-side checks
    const response = NextResponse.next();
    response.headers.set("x-has-session", sessionToken ? "true" : "false");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dash/:path*"],
};
