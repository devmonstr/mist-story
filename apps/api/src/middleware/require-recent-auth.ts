import type { NextFunction, Request, Response } from "express"
import { REAUTH_TTL_SECONDS } from "@myth/redis"
import type { AuthSessionPayload } from "@myth/shared"
import { HttpError } from "../utils/http-error"

export function requireRecentAuth(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  const session = response.locals.session as AuthSessionPayload | undefined
  if (!session) {
    return next(new HttpError(401, "Authentication required"))
  }

  const reference = session.lastReauthenticatedAt ?? session.lastVerifiedAt
  const ageMs = Date.now() - new Date(reference).getTime()
  if (!Number.isFinite(ageMs) || ageMs > REAUTH_TTL_SECONDS * 1000) {
    return next(new HttpError(403, "Recent re-authentication required"))
  }

  return next()
}
