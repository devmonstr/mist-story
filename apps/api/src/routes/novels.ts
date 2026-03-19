import { Router } from "express"
import {
  createNovelInputSchema,
  updateNovelInputSchema,
} from "@mist/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  createNovel,
  getNovel,
  listNovels,
  updateNovel,
} from "../services/novel-service"

export const novelsRouter = Router()

novelsRouter.get("/", async (_request, response, next) => {
  try {
    const payload = await listNovels(response.locals.user?.id as string | undefined)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

novelsRouter.get("/:novelId", async (request, response, next) => {
  try {
    const payload = await getNovel(String(request.params.novelId))
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

novelsRouter.post(
  "/",
  requireAuth,
  validateBody(createNovelInputSchema),
  async (request, response, next) => {
    try {
      const payload = await createNovel(response.locals.user.id as string, request.body)
      return response.status(201).json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

novelsRouter.patch(
  "/:novelId",
  requireAuth,
  validateBody(updateNovelInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateNovel(
        response.locals.user.id as string,
        String(request.params.novelId),
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)
