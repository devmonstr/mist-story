import { Router, type Response } from "express"
import {
  createNovelInputSchema,
  updateNovelInputSchema,
} from "@myth/shared"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  createNovel,
  getStudioNovel,
  listStudioNovels,
  streamNovelCover,
  updateNovel,
} from "../services/novel-service"

export const novelsRouter = Router()

function setNovelWriteCacheHeader(response: Response) {
  response.setHeader("Cache-Control", "private, no-store")
}

novelsRouter.get("/", requireAuth, async (_request, response, next) => {
  try {
    setNovelWriteCacheHeader(response)
    const payload = await listStudioNovels(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

novelsRouter.get("/:novelId", requireAuth, async (request, response, next) => {
  try {
    setNovelWriteCacheHeader(response)
    const payload = await getStudioNovel(
      response.locals.user.id as string,
      String(request.params.novelId)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

novelsRouter.get("/:novelId/cover", async (request, response, next) => {
  try {
    await streamNovelCover(
      String(request.params.novelId),
      response.locals.user?.id as string | undefined,
      response
    )
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
      setNovelWriteCacheHeader(response)
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
      setNovelWriteCacheHeader(response)
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
