import type { NextFunction, Request, Response } from "express"
import { findUserById, serializeUser } from "@myth/db"
import { SESSION_TTL_SECONDS, createRedisClient, redisKeys } from "@myth/redis"
import { authSessionPayloadSchema } from "@myth/shared"
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

    const parsed = authSessionPayloadSchema.parse(JSON.parse(payload))
    const user = await findUserById(parsed.userId)

    if (user) {
      await redis
        .multi()
        .expire(redisKeys.session(sessionId), SESSION_TTL_SECONDS)
        .sadd(redisKeys.userSessions(parsed.userId), sessionId)
        .expire(redisKeys.userSessions(parsed.userId), SESSION_TTL_SECONDS)
        .exec()

      response.locals.sessionId = sessionId
      response.locals.session = parsed
      response.locals.user = serializeUser(user)
    }

    return next()
  } catch (error) {
    return next(error as Error)
  }
}
