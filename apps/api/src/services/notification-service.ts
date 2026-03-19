import {
  countUnreadNotificationsForUser,
  deleteNotificationForUser,
  findNotificationForUser,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@mist/db"
import type { NotificationDto, NotificationsResponse } from "@mist/shared"
import { HttpError } from "../utils/http-error"

function serializeNotification(
  notification: Awaited<ReturnType<typeof findNotificationForUser>> extends infer T
    ? NonNullable<T>
    : never
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
  }
}

export async function getNotifications(userId: string): Promise<NotificationsResponse> {
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser(userId),
    countUnreadNotificationsForUser(userId),
  ])

  return {
    notifications: notifications.map((notification) =>
      serializeNotification(notification)
    ),
    unreadCount,
  }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const notification = await markNotificationReadForUser(userId, notificationId)
  if (!notification) {
    throw new HttpError(404, "Notification not found")
  }

  return serializeNotification(notification)
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
