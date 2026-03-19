import { Router } from "express"
import {
  authChallengeRequestSchema,
  authMeResponseSchema,
  authVerifyRequestSchema,
} from "@mist/shared"
import { SESSION_COOKIE_NAME } from "../config/constants"
import { sessionMiddleware } from "../middleware/session"
import { validateBody } from "../middleware/validate"
import {
  destroySession,
  issueChallenge,
  verifyChallenge,
} from "../services/auth-service"

export const authRouter = Router()

authRouter.post(
  "/challenge",
  validateBody(authChallengeRequestSchema),
  async (request, response, next) => {
    try {
      const payload = await issueChallenge(request.body.pubkey)
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
      const result = await verifyChallenge(request.body)

      response.cookie(SESSION_COOKIE_NAME, result.sessionId, {
        httpOnly: true,
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

  return response.status(204).send()
})
