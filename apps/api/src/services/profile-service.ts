import {
  createNotification,
  countFollowersForUsers,
  countFollowingForUsers,
  countPublishedNovelsForUsers,
  decimalToNumber,
  findUserById,
  findUserByPubkey,
  followUser,
  getNotificationPreferencesForUser,
  getProfileSiteStats,
  hexToNpub,
  isFollowingUser,
  listFollowerUsers,
  listFollowingUsers,
  listPublishedProfileNovels,
  npubToHex,
  toIsoString,
  unfollowUser,
  upsertUserByPubkey,
} from "@mist/db"
import { enqueueNotificationDispatch } from "@mist/queue"
import { createRedisClient } from "@mist/redis"
import type {
  MyProfileResponse,
  ProfileConnectionsResponse,
  ProfileFollowState,
  ProfilePageResponse,
  ProfileSummaryDto,
} from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"
import {
  ensureUserProfileHydrated,
  isUserProfileStale,
  syncUserProfileNow,
} from "./profile-sync-service"

const redis = createRedisClient(env.REDIS_URL)

function serializeProfileSummary(user: {
  id: string
  pubkey: string
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  nip05: string | null
  lud16: string | null
  website: string | null
  profileFetchedAt: Date | null
  profileEventCreatedAt: Date | null
}): ProfileSummaryDto {
  return {
    id: user.id,
    pubkey: user.pubkey,
    npub: hexToNpub(user.pubkey),
    handle: user.handle ?? null,
    displayName: user.displayName ?? null,
    about: user.about ?? null,
    avatarUrl: user.avatarUrl ?? null,
    bannerUrl: user.bannerUrl ?? null,
    nip05: user.nip05 ?? null,
    lud16: user.lud16 ?? null,
    website: user.website ?? null,
    profileFetchedAt: toIsoString(user.profileFetchedAt),
    profileEventCreatedAt: toIsoString(user.profileEventCreatedAt),
  }
}

async function resolveProfileUserByNpub(npub: string) {
  const pubkey = npubToHex(npub)
  if (!pubkey) {
    throw new HttpError(400, "Invalid npub")
  }

  const existingUser = await findUserByPubkey(pubkey)
  const user = existingUser ?? (await upsertUserByPubkey(pubkey))
  return ensureUserProfileHydrated(user)
}

async function serializeConnectionUsers(
  users: Array<{
    id: string
    pubkey: string
    displayName: string | null
    about: string | null
    avatarUrl: string | null
  }>
) {
  const userIds = users.map((user) => user.id)
  const [followersMap, followingMap, novelsMap] = await Promise.all([
    countFollowersForUsers(userIds),
    countFollowingForUsers(userIds),
    countPublishedNovelsForUsers(userIds),
  ])

  return users.map((user) => ({
    id: user.id,
    pubkey: user.pubkey,
    npub: hexToNpub(user.pubkey),
    displayName: user.displayName ?? null,
    about: user.about ?? null,
    avatarUrl: user.avatarUrl ?? null,
    followers: followersMap.get(user.id) ?? 0,
    following: followingMap.get(user.id) ?? 0,
    novels: novelsMap.get(user.id) ?? 0,
  }))
}

async function buildMyProfileResponse(userId: string): Promise<MyProfileResponse> {
  const existingUser = await findUserById(userId)
  if (!existingUser) {
    throw new HttpError(404, "User not found")
  }

  const user = await ensureUserProfileHydrated(existingUser)
  const stats = await getProfileSiteStats(user.id)

  return {
    profile: serializeProfileSummary(user),
    stats,
    sync: {
      lastSyncedAt: toIsoString(user.profileFetchedAt),
      isStale: isUserProfileStale(user),
    },
  }
}

export async function getProfilePage(
  npub: string,
  viewerUserId?: string
): Promise<ProfilePageResponse> {
  const user = await resolveProfileUserByNpub(npub)
  const [stats, novels, isFollowing] = await Promise.all([
    getProfileSiteStats(user.id),
    listPublishedProfileNovels(user.id),
    viewerUserId && viewerUserId !== user.id
      ? isFollowingUser(viewerUserId, user.id)
      : Promise.resolve(false),
  ])

  return {
    profile: serializeProfileSummary(user),
    stats,
    novels: novels.map((novel) => ({
      id: novel.id,
      slug: novel.slug,
      title: novel.title,
      summary: novel.summary,
      genre: novel.genre,
      coverUrl: novel.coverUrl,
      chaptersCount: novel.chaptersCount,
      rating: decimalToNumber(novel.rating),
      ratingsCount: novel.ratingsCount,
      readsCount: novel._count.readingProgress,
      publishedAt: toIsoString(novel.publishedAt),
      updatedAt: novel.updatedAt.toISOString(),
    })),
    isOwnProfile: viewerUserId === user.id,
    isFollowing,
  }
}

export async function getProfileFollowers(npub: string): Promise<ProfileConnectionsResponse> {
  const user = await resolveProfileUserByNpub(npub)
  const relations = await listFollowerUsers(user.id)

  return {
    profile: {
      npub: hexToNpub(user.pubkey),
      displayName: user.displayName ?? null,
    },
    users: await serializeConnectionUsers(relations.map((relation) => relation.follower)),
  }
}

export async function getProfileFollowing(npub: string): Promise<ProfileConnectionsResponse> {
  const user = await resolveProfileUserByNpub(npub)
  const relations = await listFollowingUsers(user.id)

  return {
    profile: {
      npub: hexToNpub(user.pubkey),
      displayName: user.displayName ?? null,
    },
    users: await serializeConnectionUsers(relations.map((relation) => relation.following)),
  }
}

export async function followProfile(
  viewerUserId: string,
  npub: string
): Promise<ProfileFollowState> {
  const user = await resolveProfileUserByNpub(npub)

  if (user.id === viewerUserId) {
    throw new HttpError(400, "You cannot follow yourself")
  }

  await followUser(viewerUserId, user.id)
  const actorUser = await findUserById(viewerUserId)

  const followPreferences = await getNotificationPreferencesForUser(user.id, [
    "USER_FOLLOWED",
  ])
  const followNotificationsEnabled = followPreferences.every(
    (preference) => preference.enabled
  )

  if (followNotificationsEnabled) {
    const notification = await createNotification({
      userId: user.id,
      actorUserId: viewerUserId,
      type: "USER_FOLLOWED",
      title: "New follower",
      message: "Someone started following you on Mist Story.",
      targetUrl: actorUser ? `/profile/${hexToNpub(actorUser.pubkey)}` : undefined,
      metadata: {
        eventType: "USER_FOLLOWED",
        followerUserId: viewerUserId,
      },
    })

    await enqueueNotificationDispatch(redis, {
      notificationId: notification.id,
    })
  }

  const stats = await getProfileSiteStats(user.id)

  return {
    npub: hexToNpub(user.pubkey),
    isFollowing: true,
    followersCount: stats.followers,
  }
}

export async function unfollowProfile(
  viewerUserId: string,
  npub: string
): Promise<ProfileFollowState> {
  const user = await resolveProfileUserByNpub(npub)

  if (user.id === viewerUserId) {
    throw new HttpError(400, "You cannot unfollow yourself")
  }

  await unfollowUser(viewerUserId, user.id)
  const stats = await getProfileSiteStats(user.id)

  return {
    npub: hexToNpub(user.pubkey),
    isFollowing: false,
    followersCount: stats.followers,
  }
}

export async function getMyProfile(userId: string) {
  return buildMyProfileResponse(userId)
}

export async function refreshMyProfile(userId: string) {
  const user = await findUserById(userId)
  if (!user) {
    throw new HttpError(404, "User not found")
  }

  await syncUserProfileNow(user.pubkey)
  return buildMyProfileResponse(userId)
}
