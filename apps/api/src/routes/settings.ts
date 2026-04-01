import { Router } from "express"
import {
  type AuthSessionPayload,
  appearanceSettingsSchema,
  createApiKeyInputSchema,
  createRelayInputSchema,
  notificationSettingsSchema,
  updateRelayInputSchema,
} from "@mist/shared"
import { SESSION_COOKIE_NAME } from "../config/constants"
import { requireAuth } from "../middleware/require-auth"
import { requireRecentAuth } from "../middleware/require-recent-auth"
import { validateBody } from "../middleware/validate"
import {
  createApiKey,
  createRelay,
  deleteRelay,
  exportSecurityAuditLog,
  getAppearanceSettings,
  getIntegrationSettings,
  getNotificationSettings,
  getSecuritySettings,
  revokeAllSecuritySessions,
  revokeCurrentSecuritySession,
  revokeApiKey,
  updateRelay,
  updateAppearanceSettings,
  updateNotificationSettings,
} from "../services/settings-service"

export const settingsRouter = Router()

settingsRouter.use(requireAuth)

settingsRouter.get("/notifications", async (_request, response, next) => {
  try {
    const payload = await getNotificationSettings(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

settingsRouter.put(
  "/notifications",
  validateBody(notificationSettingsSchema),
  async (request, response, next) => {
    try {
      const payload = await updateNotificationSettings(
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.get("/appearance", async (_request, response, next) => {
  try {
    const payload = await getAppearanceSettings(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

settingsRouter.put(
  "/appearance",
  validateBody(appearanceSettingsSchema),
  async (request, response, next) => {
    try {
      const payload = await updateAppearanceSettings(
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.get(
  "/security",
  requireRecentAuth,
  async (_request, response, next) => {
    try {
      const payload = await getSecuritySettings(response.locals.user.id as string, {
        currentSessionId: response.locals.sessionId as string | undefined,
        currentSession:
          (response.locals.session as AuthSessionPayload | undefined) ?? null,
      })
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.get(
  "/security/audit-log",
  requireRecentAuth,
  async (_request, response, next) => {
    try {
      const payload = await exportSecurityAuditLog(response.locals.user.id as string)
      const fileStamp = payload.exportedAt.slice(0, 10)
      response.setHeader("Content-Type", "application/json; charset=utf-8")
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="mist-security-audit-${fileStamp}.json"`
      )
      return response.send(JSON.stringify(payload, null, 2))
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.delete(
  "/security/sessions/current",
  requireRecentAuth,
  async (_request, response, next) => {
    try {
      const sessionId = response.locals.sessionId as string | undefined
      if (!sessionId) {
        return response.status(401).json({ error: "Unauthorized" })
      }

      await revokeCurrentSecuritySession(sessionId)
      response.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
      return response.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.delete(
  "/security/sessions",
  requireRecentAuth,
  async (_request, response, next) => {
    try {
      await revokeAllSecuritySessions(response.locals.user.id as string)
      response.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      })
      return response.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.get("/integrations", async (_request, response, next) => {
  try {
    const payload = await getIntegrationSettings(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

settingsRouter.post(
  "/api-keys",
  validateBody(createApiKeyInputSchema),
  async (request, response, next) => {
    try {
      const payload = await createApiKey(
        response.locals.user.id as string,
        request.body
      )
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.delete("/api-keys/:apiKeyId", async (request, response, next) => {
  try {
    await revokeApiKey(
      response.locals.user.id as string,
      String(request.params.apiKeyId)
    )
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})

settingsRouter.post(
  "/relays",
  validateBody(createRelayInputSchema),
  async (request, response, next) => {
    try {
      const payload = await createRelay(
        response.locals.user.id as string,
        request.body
      )
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.patch(
  "/relays/:relayId",
  validateBody(updateRelayInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateRelay(
        response.locals.user.id as string,
        String(request.params.relayId),
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

settingsRouter.delete("/relays/:relayId", async (request, response, next) => {
  try {
    await deleteRelay(
      response.locals.user.id as string,
      String(request.params.relayId)
    )
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})
