import {
  countFollowersForUser,
  countFollowingForUser,
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
  listFollowerNotificationRecipients,
  listFollowerUsersPage,
  listFollowingUsersPage,
  listPublishedProfileNovels,
  npubToHex,
  saveUserNostrProfileSnapshot,
  toIsoString,
  unfollowUser,
  upsertUserByPubkey,
} from "@myth/db"
import { getNovelGenreLabel } from "@myth/shared"
import {
  enqueueNotificationDispatch,
  enqueuePublicCatalogMetricsRefresh,
  enqueueProfileImageOptimize,
} from "@myth/queue"
import { createRedisClient } from "@myth/redis"
import type {
  MyProfileResponse,
  ProfileImageAssetType,
  ProfileConnectionsResponse,
  ProfileConnectionsQuery,
  ProfileFollowState,
  ProfilePageResponse,
  ProfileSummaryDto,
  UpdateMyProfileInput,
  UploadProfileImageInput,
  UploadProfileImageResponse,
} from "@myth/shared"
import { verifyEvent } from "nostr-tools"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"
import {
  deleteManagedProfileImageAsset,
  uploadProfileImageAsset,
} from "./profile-image-storage"
import {
  ensureUserProfileHydrated,
  isUserProfileStale,
  syncUserProfileNow,
} from "./profile-sync-service"

const redis = createRedisClient(env.REDIS_URL)

function buildPagination(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return {
    page: Math.min(page, totalPages),
    pageSize,
    totalItems,
    totalPages,
  }
}

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

type NormalizedNostrProfileContent = {
  name: string | null
  display_name: string | null
  about: string | null
  picture: string | null
  banner: string | null
  website: string | null
  nip05: string | null
  lud16: string | null
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toNullableUrl(value: unknown) {
  const normalized = toNullableString(value)
  if (!normalized) {
    return null
  }

  try {
    return new URL(normalized).toString()
  } catch {
    return null
  }
}

function normalizeNostrProfileContent(
  input: Partial<Record<string, unknown>>
): NormalizedNostrProfileContent {
  return {
    name: toNullableString(input.name),
    display_name: toNullableString(input.display_name),
    about: toNullableString(input.about),
    picture: toNullableUrl(input.picture),
    banner: toNullableUrl(input.banner),
    website: toNullableUrl(input.website),
    nip05: toNullableString(input.nip05),
    lud16: toNullableString(input.lud16),
  }
}

function sameNormalizedProfile(
  left: NormalizedNostrProfileContent,
  right: NormalizedNostrProfileContent
) {
  return (
    left.name === right.name &&
    left.display_name === right.display_name &&
    left.about === right.about &&
    left.picture === right.picture &&
    left.banner === right.banner &&
    left.website === right.website &&
    left.nip05 === right.nip05 &&
    left.lud16 === right.lud16
  )
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
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "author",
    authorId: user.id,
    reason: "follow-added",
  })

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
      genre: getNovelGenreLabel(novel.genre),
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey ?? null,
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

export async function getProfileFollowers(
  npub: string,
  input: ProfileConnectionsQuery
): Promise<ProfileConnectionsResponse> {
  const user = await resolveProfileUserByNpub(npub)
  const totalItems = await countFollowersForUser(user.id)
  const pagination = buildPagination(input.page, input.pageSize, totalItems)
  const relations = await listFollowerUsersPage({
    userId: user.id,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })

  return {
    profile: {
      npub: hexToNpub(user.pubkey),
      displayName: user.displayName ?? null,
    },
    users: await serializeConnectionUsers(relations.map((relation) => relation.follower)),
    pagination,
  }
}

export async function getProfileFollowing(
  npub: string,
  input: ProfileConnectionsQuery
): Promise<ProfileConnectionsResponse> {
  const user = await resolveProfileUserByNpub(npub)
  const totalItems = await countFollowingForUser(user.id)
  const pagination = buildPagination(input.page, input.pageSize, totalItems)
  const relations = await listFollowingUsersPage({
    userId: user.id,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })

  return {
    profile: {
      npub: hexToNpub(user.pubkey),
      displayName: user.displayName ?? null,
    },
    users: await serializeConnectionUsers(relations.map((relation) => relation.following)),
    pagination,
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
      message: "Someone started following you on Myth Story.",
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
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "author",
    authorId: user.id,
    reason: "follow-removed",
  })

  return {
    npub: hexToNpub(user.pubkey),
    isFollowing: false,
    followersCount: stats.followers,
  }
}

export async function notifyFollowersAboutPublishedNovel(input: {
  authorId: string
  novelId: string
  novelTitle: string
}) {
  const recipientUserIds = await listFollowerNotificationRecipients(
    input.authorId,
    input.authorId
  )

  for (const recipientUserId of recipientUserIds) {
    const notification = await createNotification({
      userId: recipientUserId,
      actorUserId: input.authorId,
      type: "CHAPTER_PUBLISHED",
      novelId: input.novelId,
      title: "New story published",
      message: `A writer you follow published "${input.novelTitle}".`,
      targetUrl: `/novel/${input.novelId}`,
      metadata: {
        eventType: "NOVEL_PUBLISHED",
        authorUserId: input.authorId,
      },
    })

    await enqueueNotificationDispatch(redis, {
      notificationId: notification.id,
    })
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

export async function updateMyProfile(
  userId: string,
  input: UpdateMyProfileInput
) {
  const user = await findUserById(userId)
  if (!user) {
    throw new HttpError(404, "User not found")
  }

  if (input.signedEvent.kind !== 0) {
    throw new HttpError(400, "Profile updates must use Nostr kind 0 metadata events")
  }

  if (
    input.signedEvent.pubkey !== user.pubkey ||
    !verifyEvent(input.signedEvent as Parameters<typeof verifyEvent>[0])
  ) {
    throw new HttpError(401, "Invalid signed profile metadata event")
  }

  let parsedContent: Record<string, unknown>
  try {
    const parsed = JSON.parse(input.signedEvent.content) as unknown
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Profile metadata must be an object")
    }

    parsedContent = parsed as Record<string, unknown>
  } catch {
    throw new HttpError(400, "Signed event content must be valid metadata JSON")
  }

  const normalizedSubmitted = normalizeNostrProfileContent(input.profile)
  const normalizedEvent = normalizeNostrProfileContent(parsedContent)

  if (normalizedSubmitted.display_name && !normalizedSubmitted.name) {
    throw new HttpError(400, "`name` is required when `display_name` is set")
  }

  if (!sameNormalizedProfile(normalizedSubmitted, normalizedEvent)) {
    throw new HttpError(400, "Signed event content does not match submitted profile metadata")
  }

  const updatedUser = await saveUserNostrProfileSnapshot({
    pubkey: user.pubkey,
    handle: normalizedEvent.name,
    displayName: normalizedEvent.display_name ?? normalizedEvent.name,
    about: normalizedEvent.about,
    avatarUrl: normalizedEvent.picture,
    bannerUrl: normalizedEvent.banner,
    nip05: normalizedEvent.nip05,
    lud16: normalizedEvent.lud16,
    website: normalizedEvent.website,
    profileEventId: input.signedEvent.id,
    profileEventCreatedAt: new Date(input.signedEvent.created_at * 1000),
    profileFetchedAt: new Date(),
  })

  const appliedSnapshot = updatedUser?.profileEventId === input.signedEvent.id

  if (appliedSnapshot && user.avatarUrl !== updatedUser.avatarUrl) {
    await deleteManagedProfileImageAsset(user.avatarUrl)
  }

  if (appliedSnapshot && user.bannerUrl !== updatedUser.bannerUrl) {
    await deleteManagedProfileImageAsset(user.bannerUrl)
  }

  return buildMyProfileResponse(userId)
}

export async function uploadMyProfileImage(
  userId: string,
  assetType: ProfileImageAssetType,
  input: UploadProfileImageInput
): Promise<UploadProfileImageResponse> {
  const user = await findUserById(userId)
  if (!user) {
    throw new HttpError(404, "User not found")
  }

  const uploadedAsset = await uploadProfileImageAsset({
    userId,
    assetType,
    payload: input.image,
  })

  try {
    await enqueueProfileImageOptimize(redis, {
      userId,
      assetType,
      assetId: uploadedAsset.assetId,
      sourceKey: uploadedAsset.sourceKey,
      publicKey: uploadedAsset.publicKey,
      sourceMimeType: input.image.mimeType,
    })

    return {
      url: uploadedAsset.url,
      optimization: {
        state: "queued",
      },
    }
  } catch (error) {
    console.error("[profile-image] failed to enqueue optimization job", error)

    return {
      url: uploadedAsset.url,
      optimization: {
        state: "skipped",
      },
    }
  }
}
