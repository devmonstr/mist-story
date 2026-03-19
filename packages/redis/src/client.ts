import Redis, { type RedisOptions } from "ioredis"

export interface CreateRedisClientOptions extends RedisOptions {
  url?: string
}

function resolveRedisUrl(url?: string): string {
  const resolved = url ?? process.env.REDIS_URL
  if (!resolved) {
    throw new Error("REDIS_URL is required to create a Redis client")
  }
  return resolved
}

export function createRedisClient(options: CreateRedisClientOptions = {}): Redis {
  const { url, maxRetriesPerRequest, ...redisOptions } = options
  return new Redis(resolveRedisUrl(url), {
    lazyConnect: true,
    enableReadyCheck: true,
    ...redisOptions,
    maxRetriesPerRequest: maxRetriesPerRequest ?? null,
  })
}

export function createBullMQRedisClient(options: CreateRedisClientOptions = {}): Redis {
  return createRedisClient({
    ...options,
    maxRetriesPerRequest: null,
  })
}
