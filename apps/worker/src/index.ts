import { Worker } from "bullmq"
import { queueNames } from "@mist/queue"
import { createBullMQConnection } from "@mist/redis"
import type {
  ChapterPublishJobPayload,
  NotificationDispatchJobPayload,
} from "@mist/shared"
import { env } from "./config/env"
import { processChapterPublishJob } from "./processors/chapter-publish"
import { processNotificationDispatchJob } from "./processors/notification-dispatch"

const chapterPublishConnection = createBullMQConnection(env.REDIS_URL)
const notificationConnection = createBullMQConnection(env.REDIS_URL)

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

chapterPublishWorker.on("completed", (job) => {
  console.log(`[worker] completed ${job.name}:${job.id}`)
})

chapterPublishWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

notificationWorker.on("failed", (job, error) => {
  console.error(`[worker] failed ${job?.name}:${job?.id}`, error)
})

console.log("[worker] online")
