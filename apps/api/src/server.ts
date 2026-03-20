import { ensureCatalogSearchInfrastructure } from "@mist/db"
import { createApp } from "./app"
import { env } from "./config/env"

const app = createApp()

await ensureCatalogSearchInfrastructure()

app.listen(env.API_PORT, () => {
  console.log(`[api] listening on http://localhost:${env.API_PORT}`)
})
