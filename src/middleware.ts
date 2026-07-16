import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Paths that do not require authentication
  const isPublicPath =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/request-otp") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/reset-password") ||
    pathname.startsWith("/api/website-content") ||
    pathname.startsWith("/api/payments/webhook") ||
    pathname.startsWith("/_next") ||
    pathname === "/logo.png" ||
    pathname === "/favicon.ico";

  if (isPublicPath) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // Protect all private API routes
  if (pathname.startsWith("/api")) {
    if (!token) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    const decoded = verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Protect dashboard pages
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static folders
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
