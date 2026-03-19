import {
  createChapterForNovel,
  createChapterVersionFromDraft,
  findChapterById,
  findNovelByIdOrSlug,
  listChaptersForNovel,
  serializeChapter,
  serializeChapterVersion,
  updateChapterById,
} from "@mist/db"
import { enqueueChapterPublish } from "@mist/queue"
import { createRedisClient } from "@mist/redis"
import type {
  CreateChapterInput,
  PublishChapterInput,
  UpdateChapterInput,
} from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const redis = createRedisClient(env.REDIS_URL)

export async function listChapters(novelId: string) {
  const chapters = await listChaptersForNovel(novelId)
  return chapters.map(serializeChapter)
}

export async function createChapter(novelId: string, input: CreateChapterInput) {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const chapter = await createChapterForNovel(novel.id, input)
  return serializeChapter(chapter)
}

export async function updateChapter(
  chapterId: string,
  input: UpdateChapterInput
) {
  const chapter = await findChapterById(chapterId)
  if (!chapter) {
    throw new HttpError(404, "Chapter not found")
  }

  const updated = await updateChapterById(chapterId, input)
  return serializeChapter(updated)
}

export async function publishChapter(
  chapterId: string,
  actorUserId: string,
  input: PublishChapterInput
) {
  const chapter = await findChapterById(chapterId)
  if (!chapter) {
    throw new HttpError(404, "Chapter not found")
  }

  const chapterVersion = await createChapterVersionFromDraft(
    chapterId,
    input.previewText
  )

  await enqueueChapterPublish(redis, {
    chapterVersionId: chapterVersion.id,
    actorUserId,
  })

  return serializeChapterVersion(chapterVersion)
}
