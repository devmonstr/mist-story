import { z } from "zod"

export const baseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  APP_URL: z.string().url(),
})

export type BaseEnv = z.infer<typeof baseEnvSchema>
