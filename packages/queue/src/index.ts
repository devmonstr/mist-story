import { Queue } from "bullmq"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
  PublicCatalogActivityRollupJobPayload,
  PublicCatalogMetricsRefreshJobPayload,
  PublicCatalogRankingsRefreshJobPayload,
  ProfileImageOptimizeJobPayload,
  ProfileSyncJobPayload,
} from "@myth/shared"

export const queueNames = {
  chapterPublish: "chapter-publish",
  notificationDispatch: "notification-dispatch",
  profileSync: "profile-sync",
  profileImageOptimize: "profile-image-optimize",
  publicCatalogActivityRollup: "public-catalog-activity-rollup",
  publicCatalogMetricsRefresh: "public-catalog-metrics-refresh",
  publicCatalogRankingsRefresh: "public-catalog-rankings-refresh",
} as const

export const publicCatalogSchedulerIds = {
  activityRollupEveryFiveMinutes: "public-catalog-activity-rollup-every-5-minutes",
  metricsRefreshEveryTenMinutes: "public-catalog-metrics-refresh-every-10-minutes",
  rankingsRefreshEveryFifteenMinutes: "public-catalog-rankings-refresh-every-15-minutes",
  fullReconcileDaily: "public-catalog-full-reconcile-daily",
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

export function createPublicCatalogActivityRollupQueue(connection: unknown) {
  return new Queue<
    PublicCatalogActivityRollupJobPayload,
    unknown,
    typeof queueNames.publicCatalogActivityRollup
  >(queueNames.publicCatalogActivityRollup, {
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

export function createPublicCatalogRankingsRefreshQueue(connection: unknown) {
  return new Queue<
    PublicCatalogRankingsRefreshJobPayload,
    unknown,
    typeof queueNames.publicCatalogRankingsRefresh
  >(queueNames.publicCatalogRankingsRefresh, {
    connection: connection as never,
  })
}

function toBullMqSafeJobId(value: string) {
  return value.replaceAll(":", "-")
}

function createPublicCatalogJobId(payload: {
  scope: "all" | "novel" | "author"
  novelId?: string
  authorId?: string
}) {
  if (payload.scope === "novel" && payload.novelId) {
    return toBullMqSafeJobId(`novel-${payload.novelId}`)
  }

  if (payload.scope === "author" && payload.authorId) {
    return toBullMqSafeJobId(`author-${payload.authorId}`)
  }

  return "all"
}

async function upsertRepeatableJob<TPayload, TName extends string>(
  queue: Queue<TPayload, unknown, TName>,
  schedulerId: string,
  every: number,
  jobName: TName,
  payload: TPayload
) {
  const schedulerQueue = queue as Queue<TPayload, unknown, string>

  return schedulerQueue.upsertJobScheduler(
    schedulerId as never,
    { every },
    {
      name: jobName as never,
      data: payload as never,
      opts: {
        removeOnComplete: true,
        removeOnFail: 50,
      },
    }
  )
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

export async function enqueuePublicCatalogActivityRollup(
  connection: unknown,
  payload: PublicCatalogActivityRollupJobPayload
) {
  const queue = createPublicCatalogActivityRollupQueue(connection)
  return queue.add(queueNames.publicCatalogActivityRollup, payload, {
    jobId: createPublicCatalogJobId(payload),
    removeOnComplete: true,
    removeOnFail: 50,
  })
}

export async function enqueuePublicCatalogMetricsRefresh(
  connection: unknown,
  payload: PublicCatalogMetricsRefreshJobPayload
) {
  const queue = createPublicCatalogMetricsRefreshQueue(connection)
  return queue.add(queueNames.publicCatalogMetricsRefresh, payload, {
    jobId: createPublicCatalogJobId(payload),
    removeOnComplete: true,
    removeOnFail: 50,
  })
}

export async function enqueuePublicCatalogRankingsRefresh(
  connection: unknown,
  payload: PublicCatalogRankingsRefreshJobPayload
) {
  const queue = createPublicCatalogRankingsRefreshQueue(connection)
  return queue.add(queueNames.publicCatalogRankingsRefresh, payload, {
    jobId: createPublicCatalogJobId(payload),
    removeOnComplete: true,
    removeOnFail: 50,
  })
}

export async function upsertPublicCatalogActivityRollupSchedule(
  connection: unknown,
  input: {
    schedulerId: string
    every: number
    payload: PublicCatalogActivityRollupJobPayload
  }
) {
  const queue = createPublicCatalogActivityRollupQueue(connection)
  return upsertRepeatableJob(
    queue,
    input.schedulerId,
    input.every,
    queueNames.publicCatalogActivityRollup,
    input.payload
  )
}

export async function upsertPublicCatalogMetricsRefreshSchedule(
  connection: unknown,
  input: {
    schedulerId: string
    every: number
    payload: PublicCatalogMetricsRefreshJobPayload
  }
) {
  const queue = createPublicCatalogMetricsRefreshQueue(connection)
  return upsertRepeatableJob(
    queue,
    input.schedulerId,
    input.every,
    queueNames.publicCatalogMetricsRefresh,
    input.payload
  )
}

export async function upsertPublicCatalogRankingsRefreshSchedule(
  connection: unknown,
  input: {
    schedulerId: string
    every: number
    payload: PublicCatalogRankingsRefreshJobPayload
  }
) {
  const queue = createPublicCatalogRankingsRefreshQueue(connection)
  return upsertRepeatableJob(
    queue,
    input.schedulerId,
    input.every,
    queueNames.publicCatalogRankingsRefresh,
    input.payload
  )
}
