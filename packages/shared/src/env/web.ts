import { z } from "zod"

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  WEB_PORT: z.coerce.number().default(3000),
})

export type WebEnv = z.infer<typeof webEnvSchema>
