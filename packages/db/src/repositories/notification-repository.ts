import { prisma } from "../client"

export async function createNotification(input: {
  userId: string
  actorUserId?: string
  type:
    | "CHAPTER_PUBLISHED"
    | "USER_FOLLOWED"
    | "NOVEL_BOOKMARKED"
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
  targetUrl?: string
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

export async function findNotificationForUser(userId: string, notificationId: string) {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
    include: {
      actor: true,
    },
  })
}

export async function listNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      actor: true,
    },
  })
}

export async function countUnreadNotificationsForUser(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  })
}

export async function markNotificationReadForUser(userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })

  return findNotificationForUser(userId, notificationId)
}

export async function markAllNotificationsReadForUser(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })
}

export async function deleteNotificationForUser(userId: string, notificationId: string) {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  })
}
