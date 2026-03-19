import type { NextFunction, Request, Response } from "express"
import { HttpError } from "../utils/http-error"

export function requireAuth(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  if (!response.locals.user) {
    return next(new HttpError(401, "Authentication required"))
  }

  return next()
}
