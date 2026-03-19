import { Router } from "express"
import { upsertReadingProgressInputSchema } from "@mist/shared"
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
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification-service"

export const meRouter = Router()

meRouter.get("/library", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getMyLibrary(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

meRouter.get("/notifications", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getNotifications(response.locals.user.id as string)
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
