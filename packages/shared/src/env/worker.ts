import { z } from "zod"
import { baseEnvSchema } from "./base"

export const workerEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().default(4000),
})

export type WorkerEnv = z.infer<typeof workerEnvSchema>
