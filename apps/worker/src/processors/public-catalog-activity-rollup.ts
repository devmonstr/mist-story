import { rollupPublicCatalogActivity } from "@myth/db"
import { enqueuePublicCatalogMetricsRefresh } from "@myth/queue"
import { createBullMQConnection } from "@myth/redis"
import type { PublicCatalogActivityRollupJobPayload } from "@myth/shared"
import { env } from "../config/env"

export async function processPublicCatalogActivityRollupJob(
  payload: PublicCatalogActivityRollupJobPayload
) {
  await rollupPublicCatalogActivity()
  const connection = createBullMQConnection(env.REDIS_URL)

  try {
    await enqueuePublicCatalogMetricsRefresh(connection, {
      scope: payload.scope,
      novelId: payload.novelId,
      authorId: payload.authorId,
      reason: payload.reason ?? "activity-rollup",
    })
  } finally {
    await connection.quit()
  }
}
