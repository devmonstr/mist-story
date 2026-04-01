import type { NextFunction, Request, Response } from "express"
import { HttpError } from "../utils/http-error"

export function requireAdmin(
  _request: Request,
  response: Response,
  next: NextFunction
) {
  if (!response.locals.user?.isAdmin) {
    return next(new HttpError(403, "Admin access required"))
  }

  return next()
}
