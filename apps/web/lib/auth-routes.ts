export const SESSION_COOKIE_NAME = "mist_session"

export const PROTECTED_ROUTE_PREFIXES = [
  "/bookmarks",
  "/history",
  "/my-library",
  "/notifications",
  "/settings",
  "/studio",
] as const

export function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function normalizeRedirectTarget(
  target: string | null | undefined,
  fallback = "/studio"
) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) {
    return fallback
  }

  return target
}

export function buildSignInPath(nextPath: string) {
  const normalizedNextPath = normalizeRedirectTarget(nextPath, "/studio")
  return `/sign-in?next=${encodeURIComponent(normalizedNextPath)}`
}
