import { z } from "zod"

export const notificationTypeSchema = z.enum([
  "CHAPTER_PUBLISHED",
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
})

export const notificationsResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  unreadCount: z.number(),
})

export type NotificationType = z.infer<typeof notificationTypeSchema>
export type NotificationActorDto = z.infer<typeof notificationActorSchema>
export type NotificationDto = z.infer<typeof notificationSchema>
export type NotificationsResponse = z.infer<typeof notificationsResponseSchema>
