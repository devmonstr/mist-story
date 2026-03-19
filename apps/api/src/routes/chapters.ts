import { Router } from "express"
import {
  createChapterInputSchema,
  publishChapterInputSchema,
  updateChapterInputSchema,
} from "@mist/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  createChapter,
  listChapters,
  publishChapter,
  updateChapter,
} from "../services/chapter-service"

export const chaptersRouter = Router()

chaptersRouter.get("/novels/:novelId/chapters", async (request, response, next) => {
  try {
    const payload = await listChapters(String(request.params.novelId))
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

chaptersRouter.post(
  "/novels/:novelId/chapters",
  requireAuth,
  validateBody(createChapterInputSchema),
  async (request, response, next) => {
    try {
      const payload = await createChapter(String(request.params.novelId), request.body)
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

chaptersRouter.patch(
  "/chapters/:chapterId",
  requireAuth,
  validateBody(updateChapterInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateChapter(String(request.params.chapterId), request.body)
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

chaptersRouter.post(
  "/chapters/:chapterId/publish",
  requireAuth,
  validateBody(publishChapterInputSchema),
  async (request, response, next) => {
    try {
      const payload = await publishChapter(
        String(request.params.chapterId),
        response.locals.user.id as string,
        request.body
      )
      return response.status(202).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)
