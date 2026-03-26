import { Router } from "express"
import {
  getPublicNovelChapter,
  getPublicNovelDetail,
  listLibraryCatalog,
} from "../services/catalog-service"

export const libraryRouter = Router()

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

libraryRouter.get("/", async (request, response, next) => {
  try {
    const cursorDirection =
      request.query.direction === "next" || request.query.direction === "prev"
        ? request.query.direction
        : null

    const payload = await listLibraryCatalog({
      query: typeof request.query.q === "string" ? request.query.q : undefined,
      sortBy:
        request.query.sort === "popular" ||
        request.query.sort === "recent" ||
        request.query.sort === "relevance" ||
        request.query.sort === "rating" ||
        request.query.sort === "title"
          ? request.query.sort
          : "recent",
      page: parsePositiveInt(request.query.page, 1),
      pageSize: parsePositiveInt(request.query.pageSize, 18),
      cursor: typeof request.query.cursor === "string" ? request.query.cursor : undefined,
      direction: cursorDirection,
      genre: typeof request.query.genre === "string" ? request.query.genre : undefined,
      workType:
        request.query.workType === "ORIGINAL" || request.query.workType === "TRANSLATION"
          ? request.query.workType
          : undefined,
      status:
        request.query.status === "Ongoing" ||
        request.query.status === "Completed" ||
        request.query.status === "Hiatus"
          ? request.query.status
          : undefined,
      collection:
        request.query.collection === "trending" ||
        request.query.collection === "hidden-gems" ||
        request.query.collection === "editors-picks" ||
        request.query.collection === "new-voices"
          ? request.query.collection
          : undefined,
    })
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

libraryRouter.get("/:novelId", async (request, response, next) => {
  try {
    const payload = await getPublicNovelDetail(
      String(request.params.novelId),
      response.locals.user?.id as string | undefined,
      parsePositiveInt(request.query.chapterPage, 1)
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
      response.locals.user?.id as string | undefined,
      parsePositiveInt(request.query.chapterPage, 0)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
