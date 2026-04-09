import { Router } from "express"
import {
  authChallengeRequestSchema,
  authMeResponseSchema,
  authReverifyRequestSchema,
  authVerifyRequestSchema,
} from "@mist/shared"
import {
  SESSION_COOKIE_NAME,
  SESSION_PRESENCE_COOKIE_NAME,
} from "../config/constants"
import { requireAuth } from "../middleware/require-auth"
import { sessionMiddleware } from "../middleware/session"
import { validateBody } from "../middleware/validate"
import {
  destroySession,
  issueChallenge,
  issueReauthChallenge,
  verifyReauthChallenge,
  verifyChallenge,
} from "../services/auth-service"

export const authRouter = Router()

authRouter.post(
  "/challenge",
  validateBody(authChallengeRequestSchema),
  async (request, response, next) => {
    try {
      const payload = await issueChallenge(request.body.pubkey, request)
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

authRouter.post(
  "/verify",
  validateBody(authVerifyRequestSchema),
  async (request, response, next) => {
    try {
      const result = await verifyChallenge(request.body, request)

      response.cookie(SESSION_COOKIE_NAME, result.sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      response.cookie(SESSION_PRESENCE_COOKIE_NAME, "1", {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })

      return response.json({
        user: result.user,
      })
    } catch (error) {
      return next(error)
    }
  }
)

authRouter.post(
  "/re-auth/challenge",
  requireAuth,
  async (request, response, next) => {
    try {
      const sessionId = response.locals.sessionId as string | undefined
      const user = response.locals.user as { id: string; pubkey: string } | undefined

      if (!sessionId || !user) {
        return response.status(401).json({ error: "Unauthorized" })
      }

      const payload = await issueReauthChallenge({
        sessionId,
        pubkey: user.pubkey,
        userId: user.id,
        request,
      })

      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

authRouter.post(
  "/re-auth/verify",
  requireAuth,
  validateBody(authReverifyRequestSchema),
  async (request, response, next) => {
    try {
      const sessionId = response.locals.sessionId as string | undefined
      const user = response.locals.user as { id: string; pubkey: string } | undefined

      if (!sessionId || !user) {
        return response.status(401).json({ error: "Unauthorized" })
      }

      const payload = await verifyReauthChallenge({
        sessionId,
        pubkey: user.pubkey,
        userId: user.id,
        challenge: request.body.challenge,
        signedEvent: request.body.signedEvent,
        request,
      })

      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

authRouter.get("/me", sessionMiddleware, async (_request, response) => {
  const payload = authMeResponseSchema.safeParse({
    user: response.locals.user,
  })

  if (!payload.success) {
    return response.status(401).json({ error: "Unauthorized" })
  }

  return response.json(payload.data)
})

authRouter.post("/sign-out", sessionMiddleware, async (_request, response) => {
  const sessionId = response.locals.sessionId as string | undefined
  if (sessionId) {
    await destroySession(sessionId)
  }

  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  response.clearCookie(SESSION_PRESENCE_COOKIE_NAME, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return response.status(204).send()
})
