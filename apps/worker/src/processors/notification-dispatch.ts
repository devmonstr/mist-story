import { findNotificationById } from "@mist/db"
import type { NotificationDispatchJobPayload } from "@mist/shared"
import { dispatchNotification } from "../adapters/notification-dispatcher"

export async function processNotificationDispatchJob(
  payload: NotificationDispatchJobPayload
) {
  const notification = await findNotificationById(payload.notificationId)
  if (!notification) {
    throw new Error("Notification not found")
  }

  await dispatchNotification(notification.id)
}
