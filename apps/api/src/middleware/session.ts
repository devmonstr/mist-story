import type { NextFunction, Request, Response } from "express"
import { findUserById, serializeUser } from "@mist/db"
import { createRedisClient, redisKeys } from "@mist/redis"
import { env } from "../config/env"
import { SESSION_COOKIE_NAME } from "../config/constants"

const redis = createRedisClient(env.REDIS_URL)

export async function sessionMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const sessionId = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined

    if (!sessionId) {
      return next()
    }

    const payload = await redis.get(redisKeys.session(sessionId))
    if (!payload) {
      return next()
    }

    const parsed = JSON.parse(payload) as { userId: string }
    const user = await findUserById(parsed.userId)

    if (user) {
      response.locals.sessionId = sessionId
      response.locals.user = serializeUser(user)
    }

    return next()
  } catch (error) {
    return next(error as Error)
  }
}
