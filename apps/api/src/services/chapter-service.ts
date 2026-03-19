import {
  createChapterForNovel,
  createChapterVersionFromDraft,
  deleteChapterById,
  findChapterById,
  findChapterWithNovelById,
  findNovelByIdOrSlug,
  listChaptersForNovel,
  reorderChaptersForNovel,
  serializeChapter,
  serializeChapterVersion,
  updateChapterById,
} from "@mist/db"
import { enqueueChapterPublish } from "@mist/queue"
import { createRedisClient } from "@mist/redis"
import type {
  CreateChapterInput,
  PublishChapterInput,
  ReorderChaptersInput,
  UpdateChapterInput,
} from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const redis = createRedisClient(env.REDIS_URL)

export async function listChapters(novelId: string, currentUserId?: string) {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const isOwner = novel.authorId === currentUserId
  if (!isOwner && novel.visibility !== "PUBLISHED") {
    throw new HttpError(404, "Novel not found")
  }

  const chapters = await listChaptersForNovel(novel.id)
  return chapters
    .filter((chapter) => isOwner || chapter.status === "PUBLISHED")
    .map(serializeChapter)
}

export async function createChapter(novelId: string, input: CreateChapterInput) {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const chapter = await createChapterForNovel(novel.id, input)
  return serializeChapter(chapter)
}

export async function createChapterForAuthor(
  novelId: string,
  actorUserId: string,
  input: CreateChapterInput
) {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  if (novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this novel")
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

export async function updateChapterForAuthor(
  chapterId: string,
  actorUserId: string,
  input: UpdateChapterInput
) {
  const chapter = await findChapterWithNovelById(chapterId)
  if (!chapter) {
    throw new HttpError(404, "Chapter not found")
  }

  if (chapter.novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this chapter")
  }

  const updated = await updateChapterById(chapterId, input)
  return serializeChapter(updated)
}

export async function publishChapter(
  chapterId: string,
  actorUserId: string,
  input: PublishChapterInput
) {
  const chapter = await findChapterWithNovelById(chapterId)
  if (!chapter) {
    throw new HttpError(404, "Chapter not found")
  }

  if (chapter.novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this chapter")
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

export async function deleteChapterForAuthor(
  chapterId: string,
  actorUserId: string
) {
  const chapter = await findChapterWithNovelById(chapterId)
  if (!chapter) {
    throw new HttpError(404, "Chapter not found")
  }

  if (chapter.novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this chapter")
  }

  const chapters = await listChaptersForNovel(chapter.novelId)
  if (chapters.length <= 1) {
    throw new HttpError(400, "A novel must have at least one chapter")
  }
  if (chapter.status !== "DRAFT") {
    throw new HttpError(400, "Only draft chapters can be deleted")
  }

  await deleteChapterById(chapterId)
}

export async function reorderChaptersForAuthor(
  novelId: string,
  actorUserId: string,
  input: ReorderChaptersInput
) {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  if (novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this novel")
  }

  try {
    const chapters = await reorderChaptersForNovel(novel.id, input.orderedChapterIds)
    return chapters.map(serializeChapter)
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid chapter ordering payload") {
      throw new HttpError(400, error.message)
    }

    throw error
  }
}
