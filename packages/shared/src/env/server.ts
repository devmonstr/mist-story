import { z } from "zod"

const postgresUrlSchema = z
  .string()
  .min(1)
  .refine((value) => /^postgres(ql)?:\/\//i.test(value), "Expected a PostgreSQL connection string")

const redisUrlSchema = z
  .string()
  .min(1)
  .refine((value) => /^redis(s)?:\/\//i.test(value), "Expected a Redis connection string")

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: postgresUrlSchema,
  REDIS_URL: redisUrlSchema,
  SESSION_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
  API_PORT: z.coerce.number().int().positive().default(4000),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseServerEnv(env: unknown): ServerEnv {
  return serverEnvSchema.parse(env)
}
