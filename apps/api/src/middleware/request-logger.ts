import type { NextFunction, Request, Response } from "express"

export function requestLogger(
  request: Request,
  response: Response,
  next: NextFunction
) {
  const startedAt = Date.now()
  response.on("finish", () => {
    console.log(
      `[api] ${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`
    )
  })
  next()
}
