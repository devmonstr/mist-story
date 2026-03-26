import { ensureCatalogSearchInfrastructure } from "../catalog-search"

await ensureCatalogSearchInfrastructure()
console.log("[db] catalog search infrastructure is ready")
