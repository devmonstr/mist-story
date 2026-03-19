import { Queue } from "bullmq"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
} from "@mist/shared"

export const queueNames = {
  chapterPublish: "chapter-publish",
  notificationDispatch: "notification-dispatch",
} as const

export function createChapterPublishQueue(connection: unknown) {
  return new Queue<ChapterPublishJobPayload, unknown, typeof queueNames.chapterPublish>(
    queueNames.chapterPublish,
    {
      connection: connection as never,
    }
  )
}

export function createNotificationDispatchQueue(connection: unknown) {
  return new Queue<
    NotificationDispatchJobPayload,
    unknown,
    typeof queueNames.notificationDispatch
  >(queueNames.notificationDispatch, {
    connection: connection as never,
  })
}

export async function enqueueChapterPublish(
  connection: unknown,
  payload: ChapterPublishJobPayload
) {
  const queue = createChapterPublishQueue(connection)
  return queue.add(queueNames.chapterPublish, payload)
}

export async function enqueueNotificationDispatch(
  connection: unknown,
  payload: NotificationDispatchJobPayload
) {
  const queue = createNotificationDispatchQueue(connection)
  return queue.add(queueNames.notificationDispatch, payload)
}
