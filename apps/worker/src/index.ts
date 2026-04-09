import { Worker } from "bullmq"
import {
  ensurePublicCatalogMetricsInfrastructure,
  refreshPublicCatalogMetrics,
} from "@mist/db"
import { queueNames } from "@mist/queue"
import { createBullMQConnection } from "@mist/redis"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
  PublicCatalogMetricsRefreshJobPayload,
  ProfileImageOptimizeJobPayload,
  ProfileSyncJobPayload,
} from "@mist/shared"
import { env } from "./config/env"
import { processChapterPublishJob } from "./processors/chapter-publish"
import { processProfileImageOptimizeJob } from "./processors/profile-image-optimize"
import { processNotificationDispatchJob } from "./processors/notification-dispatch"
import { processProfileSyncJob } from "./processors/profile-sync"
import { processPublicCatalogMetricsRefreshJob } from "./processors/public-catalog-metrics-refresh"

await ensurePublicCatalogMetricsInfrastructure()
await refreshPublicCatalogMetrics({ scope: "all" })

const chapterPublishConnection = createBullMQConnection(env.REDIS_URL)
const notificationConnection = createBullMQConnection(env.REDIS_URL)
const profileSyncConnection = createBullMQConnection(env.REDIS_URL)
const profileImageOptimizeConnection = createBullMQConnection(env.REDIS_URL)
const publicCatalogMetricsConnection = createBullMQConnection(env.REDIS_URL)

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

const publicCatalogMetricsWorker = new Worker<PublicCatalogMetricsRefreshJobPayload>(
  queueNames.publicCatalogMetricsRefresh,
  async (job) => processPublicCatalogMetricsRefreshJob(job.data),
  { connection: publicCatalogMetricsConnection as never }
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

publicCatalogMetricsWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

console.log("[worker] online")
