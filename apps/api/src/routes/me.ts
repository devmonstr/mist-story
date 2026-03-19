import { Router } from "express"
import { requireAuth } from "../middleware/require-auth"
import { getMyLibrary } from "../services/library-service"

export const meRouter = Router()

meRouter.get("/library", requireAuth, async (_request, response, next) => {
  try {
    const payload = await getMyLibrary(response.locals.user.id as string)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
