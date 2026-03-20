import { Router } from "express"
import {
  getPublicNovelChapter,
  getPublicNovelDetail,
  listLibraryCatalog,
} from "../services/catalog-service"

export const libraryRouter = Router()

libraryRouter.get("/", async (request, response, next) => {
  try {
    const payload = await listLibraryCatalog(
      typeof request.query.q === "string" ? request.query.q : undefined
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

libraryRouter.get("/:novelId", async (request, response, next) => {
  try {
    const payload = await getPublicNovelDetail(
      String(request.params.novelId),
      response.locals.user?.id as string | undefined
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

libraryRouter.get("/:novelId/chapters/:chapterNumber", async (request, response, next) => {
  try {
    const chapterNumber = Number.parseInt(String(request.params.chapterNumber), 10)
    if (Number.isNaN(chapterNumber) || chapterNumber < 1) {
      return response.status(400).json({ error: "Invalid chapter number" })
    }
    const payload = await getPublicNovelChapter(
      String(request.params.novelId),
      chapterNumber,
      response.locals.user?.id as string | undefined
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
