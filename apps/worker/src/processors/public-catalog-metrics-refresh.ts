import { refreshPublicCatalogMetrics } from "@mist/db"
import type { PublicCatalogMetricsRefreshJobPayload } from "@mist/shared"

export async function processPublicCatalogMetricsRefreshJob(
  payload: PublicCatalogMetricsRefreshJobPayload
) {
  await refreshPublicCatalogMetrics({
    scope: payload.scope,
    novelId: payload.novelId,
    authorId: payload.authorId,
  })
}
