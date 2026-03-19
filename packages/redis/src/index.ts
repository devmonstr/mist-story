import IORedis from "ioredis"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const AUTH_CHALLENGE_TTL_SECONDS = 60 * 5
export const PROFILE_SYNC_THROTTLE_SECONDS = 60 * 30

export const redisKeys = {
  session: (sessionId: string) => `mist:session:${sessionId}`,
  authChallenge: (pubkey: string) => `mist:auth-challenge:${pubkey}`,
  cache: (key: string) => `mist:cache:${key}`,
  profileSyncThrottle: (pubkey: string) => `mist:profile-sync:${pubkey}`,
}

export function createRedisClient(redisUrl: string) {
  return new IORedis(redisUrl)
}

export function createBullMQConnection(redisUrl: string) {
  return new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  })
}
