import { Router } from "express"
import {
  appearanceSettingsSchema,
  createApiKeyInputSchema,
  createRelayInputSchema,
  notificationSettingsSchema,
  updateRelayInputSchema,
} from "@mist/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  createApiKey,
  createRelay,
  deleteRelay,
  getAppearanceSettings,
  getIntegrationSettings,
  getNotificationSettings,
  getSecuritySettings,
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

settingsRouter.get("/security", async (_request, response, next) => {
  try {
    const payload = await getSecuritySettings(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

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
