import { enqueuePublicCatalogRankingsRefresh } from "@myth/queue"
import { createBullMQConnection } from "@myth/redis"
import { refreshPublicCatalogMetrics } from "@myth/db"
import type { PublicCatalogMetricsRefreshJobPayload } from "@myth/shared"
import { env } from "../config/env"

export async function processPublicCatalogMetricsRefreshJob(
  payload: PublicCatalogMetricsRefreshJobPayload
) {
  await refreshPublicCatalogMetrics({
    scope: payload.scope,
    novelId: payload.novelId,
    authorId: payload.authorId,
  })

  const connection = createBullMQConnection(env.REDIS_URL)

  try {
    await enqueuePublicCatalogRankingsRefresh(connection, {
      scope: payload.scope,
      novelId: payload.novelId,
      authorId: payload.authorId,
      reason: payload.reason ?? "metrics-refresh",
    })
  } finally {
    await connection.quit()
  }
}
