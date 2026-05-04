import { z } from "zod"
import { profileImageAssetTypeSchema } from "./profile.contracts"

export const chapterPublishJobPayloadSchema = z.object({
  chapterVersionId: z.string(),
  actorUserId: z.string(),
})

export const notificationDispatchJobPayloadSchema = z.object({
  notificationId: z.string(),
})

export const profileSyncJobPayloadSchema = z.object({
  pubkey: z.string().min(1),
})

export const profileImageOptimizeJobPayloadSchema = z.object({
  userId: z.string().min(1),
  assetType: profileImageAssetTypeSchema,
  assetId: z.string().min(1),
  sourceKey: z.string().min(1),
  publicKey: z.string().min(1),
  sourceMimeType: z.string().min(1),
})

export const publicCatalogMetricsRefreshJobPayloadSchema = z.object({
  scope: z.enum(["all", "novel", "author"]).default("all"),
  novelId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
})

export const publicCatalogActivityRollupJobPayloadSchema = z.object({
  scope: z.enum(["all", "novel", "author"]).default("all"),
  novelId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
})

export const publicCatalogRankingsRefreshJobPayloadSchema = z.object({
  scope: z.enum(["all", "novel", "author"]).default("all"),
  novelId: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  reason: z.string().min(1).optional(),
})

export type ChapterPublishJobPayload = z.infer<typeof chapterPublishJobPayloadSchema>
export type NotificationDispatchJobPayload = z.infer<typeof notificationDispatchJobPayloadSchema>
export type ProfileSyncJobPayload = z.infer<typeof profileSyncJobPayloadSchema>
export type ProfileImageOptimizeJobPayload = z.infer<
  typeof profileImageOptimizeJobPayloadSchema
>
export type PublicCatalogMetricsRefreshJobPayload = z.infer<
  typeof publicCatalogMetricsRefreshJobPayloadSchema
>
export type PublicCatalogActivityRollupJobPayload = z.infer<
  typeof publicCatalogActivityRollupJobPayloadSchema
>
export type PublicCatalogRankingsRefreshJobPayload = z.infer<
  typeof publicCatalogRankingsRefreshJobPayloadSchema
>
