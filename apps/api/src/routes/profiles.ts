import { Router } from "express"
import { requireAuth } from "../middleware/require-auth"
import {
  followProfile,
  getProfileFollowers,
  getProfileFollowing,
  getProfilePage,
  unfollowProfile,
} from "../services/profile-service"

export const profilesRouter = Router()

profilesRouter.get("/:npub", async (request, response, next) => {
  try {
    const payload = await getProfilePage(
      String(request.params.npub),
      response.locals.user?.id as string | undefined
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

profilesRouter.get("/:npub/followers", async (request, response, next) => {
  try {
    const payload = await getProfileFollowers(String(request.params.npub))
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

profilesRouter.get("/:npub/following", async (request, response, next) => {
  try {
    const payload = await getProfileFollowing(String(request.params.npub))
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

profilesRouter.put("/:npub/follow", requireAuth, async (request, response, next) => {
  try {
    const payload = await followProfile(
      response.locals.user.id as string,
      String(request.params.npub)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})

profilesRouter.delete("/:npub/follow", requireAuth, async (request, response, next) => {
  try {
    const payload = await unfollowProfile(
      response.locals.user.id as string,
      String(request.params.npub)
    )
    return response.json(payload)
  } catch (error) {
    return next(error)
  }
})
