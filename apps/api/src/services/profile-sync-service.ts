import {
  findUserByPubkey,
  markUserProfileFetchAttempt,
  saveUserNostrProfileSnapshot,
  upsertUserByPubkey,
} from "@myth/db"
import { enqueueProfileSync } from "@myth/queue"
import {
  createRedisClient,
  PROFILE_SYNC_THROTTLE_SECONDS,
  redisKeys,
} from "@myth/redis"
import { fetchLatestNostrProfile } from "@myth/shared/nostr-profile"
import { env } from "../config/env"

const redis = createRedisClient(env.REDIS_URL)

const PROFILE_STALE_AFTER_MS = 1000 * 60 * 60 * 6

function hasProfileData(user: {
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  nip05: string | null
  lud16: string | null
  website: string | null
}) {
  return Boolean(
    user.handle ||
      user.displayName ||
      user.about ||
      user.avatarUrl ||
      user.bannerUrl ||
      user.nip05 ||
      user.lud16 ||
      user.website
  )
}

export function isUserProfileStale(user: { profileFetchedAt: Date | null }) {
  if (!user.profileFetchedAt) {
    return true
  }

  return Date.now() - user.profileFetchedAt.getTime() > PROFILE_STALE_AFTER_MS
}

export async function syncUserProfileNow(pubkey: string) {
  await upsertUserByPubkey(pubkey)

  const snapshot = await fetchLatestNostrProfile(pubkey)
  if (!snapshot) {
    await markUserProfileFetchAttempt(pubkey)
    return findUserByPubkey(pubkey)
  }

  return saveUserNostrProfileSnapshot({
    pubkey,
    ...snapshot,
  })
}

export async function scheduleUserProfileSync(pubkey: string) {
  const lock = await redis.set(
    redisKeys.profileSyncThrottle(pubkey),
    "1",
    "EX",
    PROFILE_SYNC_THROTTLE_SECONDS,
    "NX"
  )

  if (!lock) {
    return false
  }

  await enqueueProfileSync(redis, { pubkey })
  return true
}

export async function ensureUserProfileHydrated<T extends {
  pubkey: string
  profileFetchedAt: Date | null
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  nip05: string | null
  lud16: string | null
  website: string | null
}>(user: T) {
  if (!user.profileFetchedAt || !hasProfileData(user)) {
    try {
      return (await syncUserProfileNow(user.pubkey)) ?? user
    } catch (error) {
      console.error("[profile-sync] immediate sync failed", error)
      return user
    }
  }

  if (isUserProfileStale(user)) {
    void scheduleUserProfileSync(user.pubkey).catch((error) => {
      console.error("[profile-sync] schedule failed", error)
    })
  }

  return user
}
