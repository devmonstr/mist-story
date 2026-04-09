import {
  ensurePublicCatalogMetricsInfrastructure,
  refreshPublicCatalogMetrics,
} from "../public-catalog-metrics"
import { prisma } from "../client"

await ensurePublicCatalogMetricsInfrastructure()
await refreshPublicCatalogMetrics({ scope: "all" })
await prisma.$disconnect()
console.log("[db] refreshed public catalog metrics")
