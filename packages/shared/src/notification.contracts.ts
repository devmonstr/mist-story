import { z } from "zod"

export const notificationTypeSchema = z.enum([
  "CHAPTER_PUBLISHED",
  "USER_FOLLOWED",
  "NOVEL_BOOKMARKED",
  "MENTION",
  "COMMENT_REPLY",
  "COMMENT_LIKE",
  "REPORT_UPDATE",
  "MODERATION",
  "ORDER_SETTLED",
  "NOVEL_RATED",
  "CHAPTER_PURCHASED",
  "PAYOUT_REQUEST_QUEUED",
  "PAYOUT_COMPLETED",
  "PAYOUT_FAILED",
  "ADMIN_REPORT_OPENED",
  "ADMIN_PAYOUT_REQUESTED",
  "ADMIN_PAYOUT_FAILED",
])

export const notificationActorSchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
})

export const notificationNovelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
})

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  novelId: z.string().nullable(),
  chapterId: z.string().nullable(),
  chapterNumber: z.number().nullable(),
  targetUrl: z.string().nullable(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  actor: notificationActorSchema.nullable(),
  novel: notificationNovelSchema.nullable(),
})

export const notificationPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
})

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
  pagination: notificationPaginationSchema,
})

export const notificationUnreadCountResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
})

export const notificationSummaryResponseSchema = z.object({
  unreadCount: z.number(),
})

export type NotificationType = z.infer<typeof notificationTypeSchema>
export type NotificationActorDto = z.infer<typeof notificationActorSchema>
export type NotificationNovelDto = z.infer<typeof notificationNovelSchema>
export type NotificationDto = z.infer<typeof notificationSchema>
export type NotificationPagination = z.infer<typeof notificationPaginationSchema>
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>
export type NotificationUnreadCountResponse = z.infer<
  typeof notificationUnreadCountResponseSchema
>
export type NotificationSummaryResponse = z.infer<typeof notificationSummaryResponseSchema>
