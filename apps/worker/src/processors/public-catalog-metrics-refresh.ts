import { refreshPublicCatalogMetrics } from "@myth/db"
import type { PublicCatalogMetricsRefreshJobPayload } from "@myth/shared"

export async function processPublicCatalogMetricsRefreshJob(
  payload: PublicCatalogMetricsRefreshJobPayload
) {
  await refreshPublicCatalogMetrics({
    scope: payload.scope,
    novelId: payload.novelId,
    authorId: payload.authorId,
  })
}
