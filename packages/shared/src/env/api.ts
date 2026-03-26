import { z } from "zod"
import { baseEnvSchema, r2EnvShape } from "./base"

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().default(4000),
  ...r2EnvShape,
})

export type ApiEnv = z.infer<typeof apiEnvSchema>
