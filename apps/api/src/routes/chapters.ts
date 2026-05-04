import { Router } from "express"
import {
  createChapterInputSchema,
  publishChapterInputSchema,
  reorderChaptersInputSchema,
  updateChapterInputSchema,
} from "@myth/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  createChapterForAuthor,
  deleteChapterForAuthor,
  listChapters,
  publishChapter,
  reorderChaptersForAuthor,
  updateChapterForAuthor,
} from "../services/chapter-service"

export const chaptersRouter = Router()

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

chaptersRouter.get(
  "/novels/:novelId/chapters",
  requireAuth,
  async (request, response, next) => {
    try {
      response.setHeader("Cache-Control", "private, no-store")
      const payload = await listChapters(
        String(request.params.novelId),
        response.locals.user.id as string,
        {
          chapterPage: parsePositiveInt(request.query.chapterPage, 1),
          all: String(request.query.all ?? "").toLowerCase() === "true",
        }
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

chaptersRouter.post(
  "/novels/:novelId/chapters",
  requireAuth,
  validateBody(createChapterInputSchema),
  async (request, response, next) => {
    try {
      const payload = await createChapterForAuthor(
        String(request.params.novelId),
        response.locals.user.id as string,
        request.body
      )
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

chaptersRouter.put(
  "/novels/:novelId/chapters/reorder",
  requireAuth,
  validateBody(reorderChaptersInputSchema),
  async (request, response, next) => {
    try {
      const payload = await reorderChaptersForAuthor(
        String(request.params.novelId),
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
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
      const payload = await updateChapterForAuthor(
        String(request.params.chapterId),
        response.locals.user.id as string,
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

chaptersRouter.delete(
  "/chapters/:chapterId",
  requireAuth,
  async (request, response, next) => {
    try {
      await deleteChapterForAuthor(
        String(request.params.chapterId),
        response.locals.user.id as string
      )
      return response.status(204).send()
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
