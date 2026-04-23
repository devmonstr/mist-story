import { Router } from "express"
import {
  notificationListQuerySchema,
  profileImageAssetTypeSchema,
  updateMyProfileInputSchema,
  uploadProfileImageInputSchema,
  upsertReadingProgressInputSchema,
} from "@myth/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  addBookmark,
  clearReadingHistory,
  getBookmarkState,
  getMyLibrary,
  getReadingProgress,
  removeBookmark,
  removeReadingProgress,
  saveReadingProgress,
} from "../services/library-service"
import {
  deleteNotification,
  getNotifications,
  getNotificationSummary,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification-service"
import {
  getMyProfile,
  refreshMyProfile,
  updateMyProfile,
  uploadMyProfileImage,
} from "../services/profile-service"

export const meRouter = Router()

meRouter.get("/profile", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getMyProfile(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.post("/profile/refresh", requireAuth, async (_request, response, next) => {
  try {
    const payload = await refreshMyProfile(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.put(
  "/profile",
  requireAuth,
  validateBody(updateMyProfileInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateMyProfile(
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.post(
  "/profile/assets/:assetType",
  requireAuth,
  validateBody(uploadProfileImageInputSchema),
  async (request, response, next) => {
    try {
      const parsedAssetType = profileImageAssetTypeSchema.safeParse(
        String(request.params.assetType)
      )

      if (!parsedAssetType.success) {
        return response.status(400).json({
          error: "Invalid profile asset type",
        })
      }

      const payload = await uploadMyProfileImage(
        response.locals.user.id as string,
        parsedAssetType.data,
        request.body
      )
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.get("/library", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getMyLibrary(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.get("/notifications", requireAuth, async (request, response, next) => {
  try {
    const parsedQuery = notificationListQuerySchema.parse(request.query)
    const payload = await getNotifications(response.locals.user.id as string, parsedQuery)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.get("/notifications/summary", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getNotificationSummary(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.post(
  "/notifications/:notificationId/read",
  requireAuth,
  async (request, response, next) => {
    try {
      const payload = await markNotificationRead(
        response.locals.user.id as string,
        String(request.params.notificationId)
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.post("/notifications/read-all", requireAuth, async (_request, response, next) => {
  try {
    const payload = await markAllNotificationsRead(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.delete(
  "/notifications/:notificationId",
  requireAuth,
  async (request, response, next) => {
    try {
      await deleteNotification(
        response.locals.user.id as string,
        String(request.params.notificationId)
      )
      return response.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.get("/bookmarks/:novelId", requireAuth, async (request, response, next) => {
  try {
    const payload = await getBookmarkState(
      response.locals.user.id as string,
      String(request.params.novelId)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.put("/bookmarks/:novelId", requireAuth, async (request, response, next) => {
  try {
    const payload = await addBookmark(
      response.locals.user.id as string,
      String(request.params.novelId)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.delete("/bookmarks/:novelId", requireAuth, async (request, response, next) => {
  try {
    const payload = await removeBookmark(
      response.locals.user.id as string,
      String(request.params.novelId)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.get(
  "/reading-progress/:novelId",
  requireAuth,
  async (request, response, next) => {
    try {
      const payload = await getReadingProgress(
        response.locals.user.id as string,
        String(request.params.novelId)
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.put(
  "/reading-progress",
  requireAuth,
  validateBody(upsertReadingProgressInputSchema),
  async (request, response, next) => {
    try {
      const payload = await saveReadingProgress(
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.delete(
  "/reading-progress/:novelId",
  requireAuth,
  async (request, response, next) => {
    try {
      await removeReadingProgress(
        response.locals.user.id as string,
        String(request.params.novelId)
      )
      return response.status(204).send()
    } catch (error) {
      return next(error)
    }
  }
)

meRouter.delete("/reading-progress", requireAuth, async (_request, response, next) => {
  try {
    await clearReadingHistory(response.locals.user.id as string)
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
})
