import {
  countNotificationsForUser,
  countUnreadNotificationsForUser,
  deleteNotificationForUser,
  findNotificationForUser,
  listNovelNotificationCardsByIds,
  listNotificationsForUserPage,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@myth/db"
import type {
  NotificationDto,
  NotificationListQuery,
  NotificationNovelDto,
  NotificationsResponse,
  NotificationSummaryResponse,
} from "@myth/shared"
import { HttpError } from "../utils/http-error"

type NotificationRecord = Awaited<
  ReturnType<typeof listNotificationsForUserPage>
>[number]

async function getNotificationNovelMap(novelIds: Array<string | null | undefined>) {
  const normalizedNovelIds = novelIds.filter((novelId): novelId is string => Boolean(novelId))
  const novels = await listNovelNotificationCardsByIds(normalizedNovelIds)

  return new Map<string, NotificationNovelDto>(
    novels.map((novel) => [
      novel.id,
      {
        id: novel.id,
        slug: novel.slug,
        title: novel.title,
        coverUrl: novel.coverUrl,
        coverStorageKey: novel.coverStorageKey,
      },
    ])
  )
}

function serializeNotification(
  notification: NotificationRecord | NonNullable<Awaited<ReturnType<typeof findNotificationForUser>>>,
  novel?: NotificationNovelDto | null
): NotificationDto {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    novelId: notification.novelId ?? null,
    chapterId: notification.chapterId ?? null,
    chapterNumber: notification.chapterNumber ?? null,
    targetUrl: notification.targetUrl ?? null,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
    actor: notification.actor
      ? {
          id: notification.actor.id,
          pubkey: notification.actor.pubkey,
          displayName: notification.actor.displayName ?? null,
          avatarUrl: notification.actor.avatarUrl ?? null,
        }
      : null,
    novel: novel ?? null,
  }
}

function buildPagination(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  return {
    page: Math.min(page, totalPages),
    pageSize,
    totalItems,
    totalPages,
  }
}

export async function getNotifications(
  userId: string,
  input: NotificationListQuery
): Promise<NotificationsResponse> {
  const [totalItems, unreadCount] = await Promise.all([
    countNotificationsForUser(userId),
    countUnreadNotificationsForUser(userId),
  ])
  const pagination = buildPagination(input.page, input.pageSize, totalItems)
  const notifications = await listNotificationsForUserPage({
    userId,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })
  const novelMap = await getNotificationNovelMap(
    notifications.map((notification) => notification.novelId)
  )

  return {
    notifications: notifications.map((notification) =>
      serializeNotification(
        notification,
        novelMap.get(notification.novelId ?? "") ?? null
      )
    ),
    unreadCount,
    pagination,
  }
}

export async function getNotificationSummary(
  userId: string
): Promise<NotificationSummaryResponse> {
  return {
    unreadCount: await countUnreadNotificationsForUser(userId),
  }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await markNotificationReadForUser(userId, notificationId)
  if (!notification) {
    throw new HttpError(404, "Notification not found")
  }

  const novelMap = await getNotificationNovelMap([notification.novelId])
  return serializeNotification(
    notification,
    novelMap.get(notification.novelId ?? "") ?? null
  )
}

export async function markAllNotificationsRead(userId: string) {
  const result = await markAllNotificationsReadForUser(userId)
  return {
    updatedCount: result.count,
  }
}

export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await findNotificationForUser(userId, notificationId)
  if (!notification) {
    throw new HttpError(404, "Notification not found")
  }

  await deleteNotificationForUser(userId, notificationId)
}
