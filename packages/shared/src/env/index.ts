import { apiEnvSchema } from "./api"
import { webEnvSchema } from "./web"
import { workerEnvSchema } from "./worker"

export function parseApiEnv(source: Record<string, string | undefined>) {
  return apiEnvSchema.parse(source)
}

export function parseWebEnv(source: Record<string, string | undefined>) {
  return webEnvSchema.parse(source)
}

export function parseWorkerEnv(source: Record<string, string | undefined>) {
  return workerEnvSchema.parse(source)
}

export * from "./api"
export * from "./base"
export * from "./web"
export * from "./worker"
