import { Router } from "express"
import { getHomeData } from "../services/home-service"

export const homeRouter = Router()

homeRouter.get("/", async (_request, response, next) => {
  try {
    response.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
    const payload = await getHomeData()
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
