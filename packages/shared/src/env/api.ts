import { z } from "zod"
import { baseEnvSchema } from "./base"

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().default(4000),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>
