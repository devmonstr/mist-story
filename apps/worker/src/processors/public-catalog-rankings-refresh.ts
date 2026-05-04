import { refreshPublicCatalogRankings } from "@myth/db"
import { createRedisClient, redisKeys } from "@myth/redis"
import type { PublicCatalogRankingsRefreshJobPayload } from "@myth/shared"
import { env } from "../config/env"

async function invalidatePublicRankingCaches() {
  const redis = createRedisClient(env.REDIS_URL)

  try {
    const pipeline = redis.multi()
    for (const scope of ["home", "discover", "library"]) {
      pipeline.incr(redisKeys.cache(`public:${scope}:version`))
    }
    await pipeline.exec()
  } finally {
    await redis.quit()
  }
}

export async function processPublicCatalogRankingsRefreshJob(
  payload: PublicCatalogRankingsRefreshJobPayload
) {
  await refreshPublicCatalogRankings()
  await invalidatePublicRankingCaches()
  console.log(
    `[worker] public catalog rankings refreshed for ${payload.scope} (${payload.reason ?? "unspecified"})`
  )
}
