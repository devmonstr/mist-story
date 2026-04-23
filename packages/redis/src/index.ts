import IORedis from "ioredis"

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7
export const AUTH_CHALLENGE_TTL_SECONDS = 60 * 5
export const PROFILE_SYNC_THROTTLE_SECONDS = 60 * 30
export const REAUTH_TTL_SECONDS = 60 * 10

export const redisKeys = {
  session: (sessionId: string) => `myth:session:${sessionId}`,
  userSessions: (userId: string) => `myth:user-sessions:${userId}`,
  authChallenge: (pubkey: string) => `myth:auth-challenge:${pubkey}`,
  reauthChallenge: (sessionId: string) => `myth:reauth-challenge:${sessionId}`,
  cache: (key: string) => `myth:cache:${key}`,
  profileSyncThrottle: (pubkey: string) => `myth:profile-sync:${pubkey}`,
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
