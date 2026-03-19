import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import { env } from "./config/env"
import { errorHandler } from "./middleware/error-handler"
import { requestLogger } from "./middleware/request-logger"
import { sessionMiddleware } from "./middleware/session"
import { authRouter } from "./routes/auth"
import { chaptersRouter } from "./routes/chapters"
import { meRouter } from "./routes/me"
import { novelsRouter } from "./routes/novels"

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.APP_URL,
      credentials: true,
    })
  )
  app.use(express.json({ limit: "1mb" }))
  app.use(cookieParser())
  app.use(requestLogger)
  app.use(sessionMiddleware)

  app.get("/health", (_request, response) => {
    response.json({ ok: true })
  })

  app.use("/api/v1/auth", authRouter)
  app.use("/api/v1/me", meRouter)
  app.use("/api/v1/novels", novelsRouter)
  app.use("/api/v1", chaptersRouter)

  app.use(errorHandler)

  return app
}
