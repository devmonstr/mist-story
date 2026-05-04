import { Worker } from "bullmq"
import { ensurePublicCatalogMetricsInfrastructure } from "@myth/db"
import {
  publicCatalogSchedulerIds,
  queueNames,
  upsertPublicCatalogActivityRollupSchedule,
  upsertPublicCatalogMetricsRefreshSchedule,
  upsertPublicCatalogRankingsRefreshSchedule,
} from "@myth/queue"
import { createBullMQConnection } from "@myth/redis"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
  PublicCatalogActivityRollupJobPayload,
  PublicCatalogMetricsRefreshJobPayload,
  PublicCatalogRankingsRefreshJobPayload,
  ProfileImageOptimizeJobPayload,
  ProfileSyncJobPayload,
} from "@myth/shared"
import { env } from "./config/env"
import { processChapterPublishJob } from "./processors/chapter-publish"
import { processProfileImageOptimizeJob } from "./processors/profile-image-optimize"
import { processNotificationDispatchJob } from "./processors/notification-dispatch"
import { processProfileSyncJob } from "./processors/profile-sync"
import { processPublicCatalogActivityRollupJob } from "./processors/public-catalog-activity-rollup"
import { processPublicCatalogMetricsRefreshJob } from "./processors/public-catalog-metrics-refresh"
import { processPublicCatalogRankingsRefreshJob } from "./processors/public-catalog-rankings-refresh"

await ensurePublicCatalogMetricsInfrastructure()

const chapterPublishConnection = createBullMQConnection(env.REDIS_URL)
const notificationConnection = createBullMQConnection(env.REDIS_URL)
const profileSyncConnection = createBullMQConnection(env.REDIS_URL)
const profileImageOptimizeConnection = createBullMQConnection(env.REDIS_URL)
const publicCatalogActivityRollupConnection = createBullMQConnection(env.REDIS_URL)
const publicCatalogMetricsConnection = createBullMQConnection(env.REDIS_URL)
const publicCatalogRankingsConnection = createBullMQConnection(env.REDIS_URL)
const publicCatalogScheduleConnection = createBullMQConnection(env.REDIS_URL)

await Promise.all([
  upsertPublicCatalogActivityRollupSchedule(publicCatalogScheduleConnection, {
    schedulerId: publicCatalogSchedulerIds.activityRollupEveryFiveMinutes,
    every: 5 * 60 * 1000,
    payload: {
      scope: "all",
      reason: "scheduled-activity-rollup",
    },
  }),
  upsertPublicCatalogMetricsRefreshSchedule(publicCatalogScheduleConnection, {
    schedulerId: publicCatalogSchedulerIds.metricsRefreshEveryTenMinutes,
    every: 10 * 60 * 1000,
    payload: {
      scope: "all",
      reason: "scheduled-metrics-refresh",
    },
  }),
  upsertPublicCatalogRankingsRefreshSchedule(publicCatalogScheduleConnection, {
    schedulerId: publicCatalogSchedulerIds.rankingsRefreshEveryFifteenMinutes,
    every: 15 * 60 * 1000,
    payload: {
      scope: "all",
      reason: "scheduled-rankings-refresh",
    },
  }),
  upsertPublicCatalogActivityRollupSchedule(publicCatalogScheduleConnection, {
    schedulerId: publicCatalogSchedulerIds.fullReconcileDaily,
    every: 24 * 60 * 60 * 1000,
    payload: {
      scope: "all",
      reason: "scheduled-full-reconcile",
    },
  }),
])

const chapterPublishWorker = new Worker<ChapterPublishJobPayload>(
  queueNames.chapterPublish,
  async (job) => processChapterPublishJob(job.data),
  { connection: chapterPublishConnection as never }
)

const notificationWorker = new Worker<NotificationDispatchJobPayload>(
  queueNames.notificationDispatch,
  async (job) => processNotificationDispatchJob(job.data),
  { connection: notificationConnection as never }
)

const profileSyncWorker = new Worker<ProfileSyncJobPayload>(
  queueNames.profileSync,
  async (job) => processProfileSyncJob(job.data),
  { connection: profileSyncConnection as never }
)

const profileImageOptimizeWorker = new Worker<ProfileImageOptimizeJobPayload>(
  queueNames.profileImageOptimize,
  async (job) => processProfileImageOptimizeJob(job.data),
  { connection: profileImageOptimizeConnection as never }
)

const publicCatalogActivityRollupWorker = new Worker<PublicCatalogActivityRollupJobPayload>(
  queueNames.publicCatalogActivityRollup,
  async (job) => processPublicCatalogActivityRollupJob(job.data),
  { connection: publicCatalogActivityRollupConnection as never }
)

const publicCatalogMetricsWorker = new Worker<PublicCatalogMetricsRefreshJobPayload>(
  queueNames.publicCatalogMetricsRefresh,
  async (job) => processPublicCatalogMetricsRefreshJob(job.data),
  { connection: publicCatalogMetricsConnection as never }
)

const publicCatalogRankingsWorker = new Worker<PublicCatalogRankingsRefreshJobPayload>(
  queueNames.publicCatalogRankingsRefresh,
  async (job) => processPublicCatalogRankingsRefreshJob(job.data),
  { connection: publicCatalogRankingsConnection as never }
)

chapterPublishWorker.on("completed", (job) => {
  console.log(`[worker] completed ${job.name}:${job.id}`)
})

chapterPublishWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

notificationWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

profileSyncWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

profileImageOptimizeWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

publicCatalogActivityRollupWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

publicCatalogMetricsWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

publicCatalogRankingsWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

console.log("[worker] online")
