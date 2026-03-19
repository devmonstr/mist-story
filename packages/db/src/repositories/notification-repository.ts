import { prisma } from "../client"

export async function createNotification(input: {
  userId: string
  actorUserId?: string
  type:
    | "MENTION"
    | "COMMENT_REPLY"
    | "COMMENT_LIKE"
    | "REPORT_UPDATE"
    | "MODERATION"
    | "ORDER_SETTLED"
    | "NOVEL_RATED"
    | "CHAPTER_PURCHASED"
    | "PAYOUT_REQUEST_QUEUED"
    | "PAYOUT_COMPLETED"
    | "PAYOUT_FAILED"
    | "ADMIN_REPORT_OPENED"
    | "ADMIN_PAYOUT_REQUESTED"
    | "ADMIN_PAYOUT_FAILED"
  novelId?: string
  chapterId?: string
  chapterNumber?: number
  title: string
  message: string
  metadata?: unknown
}) {
  return prisma.notification.create({
    data: {
      ...input,
      metadata: input.metadata as never,
    },
  })
}

export async function findNotificationById(notificationId: string) {
  return prisma.notification.findUnique({
    where: { id: notificationId },
  })
}
