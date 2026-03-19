import type { NextFunction, Request, Response } from "express"
import { HttpError } from "../utils/http-error"

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  next: NextFunction
) {
  void next

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      error: error.message,
    })
  }

  console.error("[api] unhandled error", error)
  return response.status(500).json({
    error: "Internal server error",
  })
}
