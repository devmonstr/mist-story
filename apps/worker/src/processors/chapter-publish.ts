import {
  createNotification,
  findChapterVersionById,
  markChapterVersionFailed,
  markChapterVersionPublished,
  upsertChapterVersionRelayPublish,
} from "@mist/db"
import { enqueueNotificationDispatch } from "@mist/queue"
import { createRedisClient } from "@mist/redis"
import type { ChapterPublishJobPayload } from "@mist/shared"
import { env } from "../config/env"
import { publishChapterVersionToRelay } from "../adapters/relay-publisher"

const redis = createRedisClient(env.REDIS_URL)

export async function processChapterPublishJob(payload: ChapterPublishJobPayload) {
  const chapterVersion = await findChapterVersionById(payload.chapterVersionId)
  if (!chapterVersion) {
    throw new Error("Chapter version not found")
  }

  try {
    const published = await publishChapterVersionToRelay(payload.chapterVersionId)

    await upsertChapterVersionRelayPublish({
      chapterVersionId: payload.chapterVersionId,
      relayUrl: published.relayUrl,
      publishState: "SUCCESS",
      eventId: published.eventId,
    })

    const updated = await markChapterVersionPublished({
      chapterVersionId: payload.chapterVersionId,
      publishedEventId: published.eventId,
      publishedRelayCount: published.relayCount,
    })

    const notification = await createNotification({
      userId: payload.actorUserId,
      actorUserId: payload.actorUserId,
      type: "CHAPTER_PUBLISHED",
      novelId: chapterVersion.chapter.novel.id,
      chapterId: chapterVersion.chapter.id,
      chapterNumber: chapterVersion.chapter.number,
      title: "Chapter published",
      message: `${chapterVersion.chapter.title} has been published.`,
      targetUrl: `/studio/${chapterVersion.chapter.novel.id}`,
      metadata: {
        eventType: "CHAPTER_PUBLISHED",
        chapterVersionId: updated.id,
      },
    })

    await enqueueNotificationDispatch(redis, {
      notificationId: notification.id,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed"
    await upsertChapterVersionRelayPublish({
      chapterVersionId: payload.chapterVersionId,
      relayUrl: "wss://relay.mist-story.local",
      publishState: "FAILED",
      lastError: message,
    })
    await markChapterVersionFailed(payload.chapterVersionId, message)
    throw error
  }
}
