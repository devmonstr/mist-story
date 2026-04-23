import { Queue } from "bullmq"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
  PublicCatalogMetricsRefreshJobPayload,
  ProfileImageOptimizeJobPayload,
  ProfileSyncJobPayload,
} from "@mist/shared"

export const queueNames = {
  chapterPublish: "chapter-publish",
  notificationDispatch: "notification-dispatch",
  profileSync: "profile-sync",
  profileImageOptimize: "profile-image-optimize",
  publicCatalogMetricsRefresh: "public-catalog-metrics-refresh",
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

export function createProfileSyncQueue(connection: unknown) {
  return new Queue<ProfileSyncJobPayload, unknown, typeof queueNames.profileSync>(
    queueNames.profileSync,
    {
      connection: connection as never,
    }
  )
}

export function createProfileImageOptimizeQueue(connection: unknown) {
  return new Queue<
    ProfileImageOptimizeJobPayload,
    unknown,
    typeof queueNames.profileImageOptimize
  >(queueNames.profileImageOptimize, {
    connection: connection as never,
  })
}

export function createPublicCatalogMetricsRefreshQueue(connection: unknown) {
  return new Queue<
    PublicCatalogMetricsRefreshJobPayload,
    unknown,
    typeof queueNames.publicCatalogMetricsRefresh
  >(queueNames.publicCatalogMetricsRefresh, {
    connection: connection as never,
  })
}

function toBullMqSafeJobId(value: string) {
  return value.replaceAll(":", "-")
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

export async function enqueueProfileSync(
  connection: unknown,
  payload: ProfileSyncJobPayload
) {
  const queue = createProfileSyncQueue(connection)
  return queue.add(queueNames.profileSync, payload)
}

export async function enqueueProfileImageOptimize(
  connection: unknown,
  payload: ProfileImageOptimizeJobPayload
) {
  const queue = createProfileImageOptimizeQueue(connection)
  return queue.add(queueNames.profileImageOptimize, payload, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10_000,
    },
  })
}

export async function enqueuePublicCatalogMetricsRefresh(
  connection: unknown,
  payload: PublicCatalogMetricsRefreshJobPayload
) {
  const queue = createPublicCatalogMetricsRefreshQueue(connection)
  const jobId =
    payload.scope === "novel" && payload.novelId
      ? toBullMqSafeJobId(`novel-${payload.novelId}`)
      : payload.scope === "author" && payload.authorId
        ? toBullMqSafeJobId(`author-${payload.authorId}`)
        : "all"

  return queue.add(queueNames.publicCatalogMetricsRefresh, payload, {
    jobId,
    removeOnComplete: true,
    removeOnFail: 50,
  })
}
