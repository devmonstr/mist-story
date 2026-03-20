import { Router } from "express"
import { getDiscoverData, searchCatalog } from "../services/discover-search-service"

export const discoverRouter = Router()

function parsePositiveInt(value: unknown, fallback: number) {
  const parsed = Number.parseInt(typeof value === "string" ? value : "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

discoverRouter.get("/", async (request, response, next) => {
  try {
    const payload = await getDiscoverData({
      query: typeof request.query.q === "string" ? request.query.q : undefined,
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
      sort:
        request.query.sort === "popular" ||
        request.query.sort === "recent" ||
        request.query.sort === "relevance"
          ? request.query.sort
          : undefined,
    })
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

discoverRouter.get("/search", async (request, response, next) => {
  try {
    const query = typeof request.query.q === "string" ? request.query.q : ""
    const filterType =
      request.query.type === "novel" || request.query.type === "author"
        ? request.query.type
        : "all"
    const sortBy =
      request.query.sort === "popular" ||
      request.query.sort === "recent" ||
      request.query.sort === "relevance"
        ? request.query.sort
        : "relevance"

    const payload = await searchCatalog({
      query,
      filterType,
      sortBy,
      page: parsePositiveInt(request.query.page, 1),
      pageSize: parsePositiveInt(request.query.pageSize, 20),
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
    })

    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
