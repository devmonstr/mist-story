import { z } from "zod"
import { nostrProfileSchema, signedNostrEventSchema } from "./auth.contracts"
import { novelCoverUploadSchema } from "./novel.contracts"

export const profileSummarySchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  npub: z.string(),
  handle: z.string().nullable(),
  displayName: z.string().nullable(),
  about: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  nip05: z.string().nullable(),
  lud16: z.string().nullable(),
  website: z.string().nullable(),
  profileFetchedAt: z.string().nullable(),
  profileEventCreatedAt: z.string().nullable(),
})

export const profileStatsSchema = z.object({
  novels: z.number().int().nonnegative(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  totalReads: z.number().int().nonnegative(),
})

export const profileNovelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
  chaptersCount: z.number().int().nonnegative(),
  rating: z.number(),
  ratingsCount: z.number().int().nonnegative(),
  readsCount: z.number().int().nonnegative(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
})

export const profilePageResponseSchema = z.object({
  profile: profileSummarySchema,
  stats: profileStatsSchema,
  novels: z.array(profileNovelSchema),
  isOwnProfile: z.boolean(),
  isFollowing: z.boolean(),
})

export const profileFollowStateSchema = z.object({
  npub: z.string(),
  isFollowing: z.boolean(),
  followersCount: z.number().int().nonnegative(),
})

export const profileConnectionSchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  npub: z.string(),
  displayName: z.string().nullable(),
  about: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  followers: z.number().int().nonnegative(),
  following: z.number().int().nonnegative(),
  novels: z.number().int().nonnegative(),
})

export const profileConnectionsPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
})

export const profileConnectionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const profileConnectionsResponseSchema = z.object({
  profile: z.object({
    npub: z.string(),
    displayName: z.string().nullable(),
  }),
  users: z.array(profileConnectionSchema),
  pagination: profileConnectionsPaginationSchema,
})

export const myProfileResponseSchema = z.object({
  profile: profileSummarySchema,
  stats: profileStatsSchema,
  sync: z.object({
    lastSyncedAt: z.string().nullable(),
    isStale: z.boolean(),
  }),
})

export const updateMyProfileInputSchema = z.object({
  profile: nostrProfileSchema,
  signedEvent: signedNostrEventSchema.extend({
    id: z.string(),
    sig: z.string(),
  }),
})

export const profileImageAssetTypeSchema = z.enum(["avatar", "banner"])

export const uploadProfileImageInputSchema = z.object({
  image: novelCoverUploadSchema,
})

export const uploadProfileImageResponseSchema = z.object({
  url: z.string().url(),
  optimization: z.object({
    state: z.enum(["queued", "skipped"]),
  }),
})

export type ProfileSummaryDto = z.infer<typeof profileSummarySchema>
export type ProfileStatsDto = z.infer<typeof profileStatsSchema>
export type ProfileNovelDto = z.infer<typeof profileNovelSchema>
export type ProfilePageResponse = z.infer<typeof profilePageResponseSchema>
export type ProfileFollowState = z.infer<typeof profileFollowStateSchema>
export type ProfileConnectionDto = z.infer<typeof profileConnectionSchema>
export type ProfileConnectionsPagination = z.infer<typeof profileConnectionsPaginationSchema>
export type ProfileConnectionsQuery = z.infer<typeof profileConnectionsQuerySchema>
export type ProfileConnectionsResponse = z.infer<typeof profileConnectionsResponseSchema>
export type MyProfileResponse = z.infer<typeof myProfileResponseSchema>
export type UpdateMyProfileInput = z.infer<typeof updateMyProfileInputSchema>
export type ProfileImageAssetType = z.infer<typeof profileImageAssetTypeSchema>
export type UploadProfileImageInput = z.infer<typeof uploadProfileImageInputSchema>
export type UploadProfileImageResponse = z.infer<typeof uploadProfileImageResponseSchema>
