import { z } from "zod"

export const chapterPublishJobPayloadSchema = z.object({
  chapterVersionId: z.string(),
  actorUserId: z.string(),
})

export const notificationDispatchJobPayloadSchema = z.object({
  notificationId: z.string(),
})

export type ChapterPublishJobPayload = z.infer<typeof chapterPublishJobPayloadSchema>
export type NotificationDispatchJobPayload = z.infer<typeof notificationDispatchJobPayloadSchema>
