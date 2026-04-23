import {
  createNotification,
  findChapterVersionById,
  listBookmarkNotificationRecipientsForNovel,
  markChapterVersionFailed,
  markChapterVersionPublished,
  upsertChapterVersionRelayPublish,
} from "@myth/db"
import { enqueueNotificationDispatch } from "@myth/queue"
import { createRedisClient } from "@myth/redis"
import type { ChapterPublishJobPayload } from "@myth/shared"
import { env } from "../config/env"
import { publishChapterVersionToRelay } from "../adapters/relay-publisher"

const redis = createRedisClient(env.REDIS_URL)

async function enqueueCreatedNotification(notificationId: string) {
  await enqueueNotificationDispatch(redis, {
    notificationId,
  })
}

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

    const recipientUserIds = await listBookmarkNotificationRecipientsForNovel(
      chapterVersion.chapter.novel.id,
      payload.actorUserId
    )

    const authorNotification = await createNotification({
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

    await enqueueCreatedNotification(authorNotification.id)

    for (const recipientUserId of recipientUserIds) {
      const readerNotification = await createNotification({
        userId: recipientUserId,
        actorUserId: payload.actorUserId,
        type: "CHAPTER_PUBLISHED",
        novelId: chapterVersion.chapter.novel.id,
        chapterId: chapterVersion.chapter.id,
        chapterNumber: chapterVersion.chapter.number,
        title: `New chapter in ${chapterVersion.chapter.novel.title}`,
        message: `${chapterVersion.chapter.title} is now available to read.`,
        targetUrl: `/novel/${chapterVersion.chapter.novel.id}/read/${chapterVersion.chapter.number}`,
        metadata: {
          eventType: "CHAPTER_PUBLISHED",
          chapterVersionId: updated.id,
        },
      })

      await enqueueCreatedNotification(readerNotification.id)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publish failed"
    await upsertChapterVersionRelayPublish({
      chapterVersionId: payload.chapterVersionId,
      relayUrl: "wss://relay.myth_story.local",
      publishState: "FAILED",
      lastError: message,
    })
    await markChapterVersionFailed(payload.chapterVersionId, message)
    throw error
  }
}
