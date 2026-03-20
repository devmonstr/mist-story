import { Router } from "express"
import { getDiscoverData, searchCatalog } from "../services/discover-search-service"

export const discoverRouter = Router()

discoverRouter.get("/", async (_request, response, next) => {
  try {
    const payload = await getDiscoverData()
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
      request.query.sort === "popular" || request.query.sort === "recent"
        ? request.query.sort
        : "relevance"

    const payload = await searchCatalog({
      query,
      filterType,
      sortBy,
    })

    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
