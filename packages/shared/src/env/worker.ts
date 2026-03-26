import { z } from "zod"
import { baseEnvSchema, r2EnvShape } from "./base"

export const workerEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().default(4000),
  ...r2EnvShape,
})

export type WorkerEnv = z.infer<typeof workerEnvSchema>
