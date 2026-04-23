import { createHash } from "node:crypto"
import { createRedisClient, redisKeys } from "@myth/redis"
import { env } from "../config/env"

const redis = createRedisClient(env.REDIS_URL)

export const PUBLIC_CACHE_TTLS = {
  discover: 60,
  library: 45,
  search: 30,
} as const

export type PublicCacheScope = keyof typeof PUBLIC_CACHE_TTLS

type StableCacheValue =
  | string
  | number
  | boolean
  | null
  | StableCacheValue[]
  | { [key: string]: StableCacheValue }

function normalizeCacheValue(value: unknown): StableCacheValue {
  if (value === null || value === undefined) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeCacheValue(item))
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))

    return Object.fromEntries(
      entries.map(([key, entry]) => [key, normalizeCacheValue(entry)])
    )
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }

  return String(value)
}

function buildVersionKey(scope: PublicCacheScope) {
  return redisKeys.cache(`public:${scope}:version`)
}

function buildPayloadKey(scope: PublicCacheScope, version: string, input: unknown) {
  const digest = createHash("sha1")
    .update(JSON.stringify(normalizeCacheValue(input)))
    .digest("hex")

  return redisKeys.cache(`public:${scope}:v${version}:${digest}`)
}

async function getCacheVersion(scope: PublicCacheScope) {
  const key = buildVersionKey(scope)
  const current = await redis.get(key)
  if (current) {
    return current
  }

  await redis.set(key, "1", "NX")
  return (await redis.get(key)) ?? "1"
}

export async function withPublicCache<T>(
  scope: PublicCacheScope,
  input: unknown,
  loader: () => Promise<T>,
  ttlSeconds = PUBLIC_CACHE_TTLS[scope]
): Promise<T> {
  try {
    const version = await getCacheVersion(scope)
    const key = buildPayloadKey(scope, version, input)
    const cached = await redis.get(key)

    if (cached) {
      return JSON.parse(cached) as T
    }

    const freshValue = await loader()
    await redis.set(key, JSON.stringify(freshValue), "EX", ttlSeconds)
    return freshValue
  } catch (error) {
    console.error(`[public-cache] ${scope} cache fallback`, error)
    return loader()
  }
}

export async function invalidatePublicCacheScopes(...scopes: PublicCacheScope[]) {
  const uniqueScopes = [...new Set(scopes)]
  if (uniqueScopes.length === 0) {
    return
  }

  try {
    const pipeline = redis.multi()
    for (const scope of uniqueScopes) {
      pipeline.incr(buildVersionKey(scope))
    }
    await pipeline.exec()
  } catch (error) {
    console.error("[public-cache] failed to invalidate scopes", error)
  }
}
