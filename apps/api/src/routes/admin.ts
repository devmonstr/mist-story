import { Router } from "express"
import {
  adminNovelListQuerySchema,
  adminUserListQuerySchema,
  updateAdminNovelVisibilityInputSchema,
  updateAdminUserRolesInputSchema,
} from "@myth/shared"
import { requireAdmin } from "../middleware/require-admin"
import { requireAuth } from "../middleware/require-auth"
import { validateBody } from "../middleware/validate"
import {
  getAdminStudioSnapshot,
  listAdminNovels,
  listAdminUsers,
  updateAdminNovelVisibility,
  updateAdminUserRoles,
} from "../services/admin-service"

export const adminRouter = Router()

adminRouter.use(requireAuth, requireAdmin)

adminRouter.get("/studio", async (_request, response, next) => {
  try {
    const payload = await getAdminStudioSnapshot()
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

adminRouter.get("/users", async (request, response, next) => {
  try {
    const parsedQuery = adminUserListQuerySchema.parse(request.query)
    const payload = await listAdminUsers(parsedQuery)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

adminRouter.get("/novels", async (request, response, next) => {
  try {
    const parsedQuery = adminNovelListQuerySchema.parse(request.query)
    const payload = await listAdminNovels(parsedQuery)
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

adminRouter.patch(
  "/users/:userId/roles",
  validateBody(updateAdminUserRolesInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateAdminUserRoles(
        response.locals.user.id as string,
        String(request.params.userId),
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)

adminRouter.patch(
  "/novels/:novelId/visibility",
  validateBody(updateAdminNovelVisibilityInputSchema),
  async (request, response, next) => {
    try {
      const payload = await updateAdminNovelVisibility(
        String(request.params.novelId),
        request.body
      )
      return response.json(payload)
    } catch (error) {
      return next(error)
    }
  }
)
