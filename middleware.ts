import { NextResponse, type NextRequest } from "next/server";

// Public paths that do not require authentication
const PUBLIC_PATHS = new Set([
  "/login",
  "/auth/callback",
  "/auth/confirm",
  "/invite",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and API health — always allow
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next();
  }

  // Public routes — allow
  if (PUBLIC_PATHS.has(pathname) || pathname.startsWith("/invite/")) {
    return NextResponse.next();
  }

  // API routes carry their own auth checks (verifyJwtToken)
  // Middleware only enforces the session cookie for page navigation.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check for session cookie (set by Supabase Auth after login or 1-click demo switcher)
  const hasSession =
    request.cookies.has("teams_demo_role") ||
    request.cookies.has("teams_auth_token") ||
    request.cookies.has("sb-access-token") ||
    request.cookies.has("sb-refresh-token") ||
    // Supabase v2 cookie name pattern
    request.cookies.getAll().some((c) =>
      c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
    );

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
