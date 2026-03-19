import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import {
  buildSignInPath,
  isProtectedRoute,
  SESSION_COOKIE_NAME,
} from "@/lib/auth-routes"

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next()
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (sessionCookie) {
    return NextResponse.next()
  }

  const nextPath = search ? `${pathname}${search}` : pathname
  const signInUrl = new URL(buildSignInPath(nextPath), request.url)

  return NextResponse.redirect(signInUrl)
}

export const config = {
  matcher: [
    "/bookmarks/:path*",
    "/history/:path*",
    "/my-library/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/studio/:path*",
  ],
}
