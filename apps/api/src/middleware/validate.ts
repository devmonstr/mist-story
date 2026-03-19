import type { NextFunction, Request, Response } from "express"
import type { ZodTypeAny } from "zod"
import { HttpError } from "../utils/http-error"

export function validateBody(schema: ZodTypeAny) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const parsed = schema.safeParse(request.body)
    if (!parsed.success) {
      return next(
        new HttpError(
          400,
          parsed.error.issues.map((issue) => issue.message).join(", ")
        )
      )
    }

    request.body = parsed.data
    return next()
  }
}
