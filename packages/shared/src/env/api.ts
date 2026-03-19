import { z } from "zod"
import { baseEnvSchema } from "./base"

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().default(4000),
})

export type ApiEnv = z.infer<typeof apiEnvSchema>
