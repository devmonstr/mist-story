import {
  countChaptersForNovel,
  createChapterForNovel,
  createChapterVersionFromDraft,
  deleteChapterById,
  findMaxChapterNumberForNovel,
  findChapterById,
  findChapterWithNovelById,
  findNovelByIdOrSlug,
  listChaptersForNovel,
  listChaptersForNovelPage,
  reorderChapterPageForNovel,
  serializeChapter,
  serializeChapterVersion,
  updateChapterById,
} from "@myth/db"
import { enqueueChapterPublish } from "@myth/queue"
import { createRedisClient } from "@myth/redis"
import type {
  CreateChapterInput,
  PublishChapterInput,
  ReorderChaptersInput,
  StudioChapterListResponse,
  UpdateChapterInput,
} from "@myth/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const redis = createRedisClient(env.REDIS_URL)
const STUDIO_CHAPTER_LIST_PAGE_SIZE = 100

function normalizeChapterPage(page: number | undefined, totalPages: number) {
  const fallback = totalPages > 0 ? 1 : 1
  if (!Number.isFinite(page) || !page || page < 1) {
    return fallback
  }

  return Math.min(Math.floor(page), Math.max(totalPages, 1))
}

function buildStudioChapterList(input: {
  totalChapters: number
  maxChapterNumber: number
  currentPage: number
  pageSize: number
}): StudioChapterListResponse["chapterList"] {
  const totalPages =
    input.totalChapters === 0
      ? 1
      : Math.max(1, Math.ceil(input.totalChapters / input.pageSize))
  const safeCurrentPage = normalizeChapterPage(input.currentPage, totalPages)
  const visibleFrom =
    input.totalChapters === 0 ? 0 : (safeCurrentPage - 1) * input.pageSize + 1
  const visibleTo =
    input.totalChapters === 0
      ? 0
      : Math.min(input.totalChapters, safeCurrentPage * input.pageSize)

  return {
    totalChapters: input.totalChapters,
    maxChapterNumber: input.maxChapterNumber,
    currentPage: safeCurrentPage,
    pageSize: input.pageSize,
    totalPages,
    visibleFrom,
    visibleTo,
    hasPreviousPage: safeCurrentPage > 1,
    hasNextPage: safeCurrentPage < totalPages,
  }
}

export async function listChapters(
  novelId: string,
  currentUserId?: string,
  options?: {
    chapterPage?: number
    all?: boolean
  }
): Promise<StudioChapterListResponse> {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const isOwner = novel.authorId === currentUserId
  if (!isOwner && novel.visibility !== "PUBLISHED") {
    throw new HttpError(404, "Novel not found")
  }

  const totalChapters = isOwner
    ? novel.chaptersCount
    : await countChaptersForNovel({
        novelId: novel.id,
        status: "PUBLISHED",
      })
  const maxChapterNumber = await findMaxChapterNumberForNovel({
    novelId: novel.id,
    status: isOwner ? undefined : "PUBLISHED",
  })

  if (options?.all) {
    const chapters = await listChaptersForNovel(novel.id)
    const visibleChapters = chapters.filter(
      (chapter) => isOwner || chapter.status === "PUBLISHED"
    )

    return {
      chapters: visibleChapters.map(serializeChapter),
      chapterList: buildStudioChapterList({
        totalChapters: visibleChapters.length,
        maxChapterNumber,
        currentPage: 1,
        pageSize: Math.max(visibleChapters.length, 1),
      }),
    }
  }

  const chapterList = buildStudioChapterList({
    totalChapters,
    maxChapterNumber,
    currentPage: options?.chapterPage ?? 1,
    pageSize: STUDIO_CHAPTER_LIST_PAGE_SIZE,
  })

  const chapters = await listChaptersForNovelPage({
    novelId: novel.id,
    page: chapterList.currentPage,
    pageSize: chapterList.pageSize,
    status: isOwner ? undefined : "PUBLISHED",
  })

  return {
    chapters: chapters.map(serializeChapter),
    chapterList,
  }
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
): Promise<StudioChapterListResponse> {
  const novel = await findNovelByIdOrSlug(novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  if (novel.authorId !== actorUserId) {
    throw new HttpError(403, "You do not have access to this novel")
  }

  try {
    const totalPages = Math.max(
      1,
      Math.ceil(Math.max(novel.chaptersCount, 1) / STUDIO_CHAPTER_LIST_PAGE_SIZE)
    )

    if (input.chapterPage > totalPages) {
      throw new HttpError(400, "Invalid chapter ordering payload")
    }

    const chapterList = buildStudioChapterList({
      totalChapters: novel.chaptersCount,
      maxChapterNumber: await findMaxChapterNumberForNovel({
        novelId: novel.id,
      }),
      currentPage: input.chapterPage,
      pageSize: STUDIO_CHAPTER_LIST_PAGE_SIZE,
    })

    const chapters = await reorderChapterPageForNovel({
      novelId: novel.id,
      page: chapterList.currentPage,
      pageSize: chapterList.pageSize,
      totalChapters: novel.chaptersCount,
      orderedChapterIds: input.orderedChapterIds,
    })

    return {
      chapters: chapters.map(serializeChapter),
      chapterList,
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error
    }

    if (error instanceof Error && error.message === "Invalid chapter ordering payload") {
      throw new HttpError(400, error.message)
    }

    throw error
  }
}
