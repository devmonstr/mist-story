import {
  createNotification,
  findChapterById,
  findChapterForNovelByNumber,
  findNovelBookmarkForUser,
  findNovelByIdOrSlug,
  listBookmarkedNovelsForUser,
  listReadingProgressForUser,
  upsertNovelBookmarkForUser,
  upsertReadingProgressForUser,
  deleteNovelBookmarkForUser,
  findReadingProgressForUserAndNovel,
  deleteReadingProgressForUserAndNovel,
  clearReadingProgressForUser,
} from "@myth/db"
import type {
  BookmarkState,
  MyLibraryContinueReadingDto,
  MyLibraryResponse,
  MyLibrarySavedNovelDto,
  ReadingProgressState,
  UpsertReadingProgressInput,
} from "@myth/shared"
import {
  enqueueNotificationDispatch,
  enqueuePublicCatalogMetricsRefresh,
} from "@myth/queue"
import { createRedisClient } from "@myth/redis"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const redis = createRedisClient(env.REDIS_URL)

function calculateProgressPercent(chapterNumber: number, totalChapters: number) {
  if (totalChapters <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round((chapterNumber / totalChapters) * 100)))
}

export async function getMyLibrary(userId: string): Promise<MyLibraryResponse> {
  const [savedNovels, continueReading] = await Promise.all([
    listBookmarkedNovelsForUser(userId),
    listReadingProgressForUser(userId),
  ])

  const progressByNovelId = new Map(continueReading.map((entry) => [entry.novelId, entry]))

  const savedNovelDtos: MyLibrarySavedNovelDto[] = savedNovels.map((bookmark) => {
    const progress = progressByNovelId.get(bookmark.novelId)
    const latestChapter =
      bookmark.novel.chapters[0]?.updatedAt ??
      bookmark.novel.chapters[0]?.publishedAt ??
      null

    return {
      novelId: bookmark.novel.id,
      slug: bookmark.novel.slug,
      title: bookmark.novel.title,
      authorDisplayName: bookmark.novel.authorDisplayName,
      genre: bookmark.novel.genre,
      summary: bookmark.novel.summary,
      coverUrl: bookmark.novel.coverUrl,
      coverStorageKey: bookmark.novel.coverStorageKey ?? null,
      savedAt: bookmark.createdAt.toISOString(),
      latestChapterUpdatedAt: latestChapter?.toISOString() ?? null,
      progressPercent: progress
        ? calculateProgressPercent(progress.chapterNumber, progress.novel.chaptersCount)
        : 0,
      currentChapterNumber: progress?.chapterNumber ?? null,
    }
  })

  const continueReadingDtos: MyLibraryContinueReadingDto[] = continueReading.map((entry) => ({
    novelId: entry.novel.id,
    slug: entry.novel.slug,
    title: entry.novel.title,
    authorDisplayName: entry.novel.authorDisplayName,
    genre: entry.novel.genre,
    summary: entry.novel.summary,
    coverUrl: entry.novel.coverUrl,
    coverStorageKey: entry.novel.coverStorageKey ?? null,
    currentChapterNumber: entry.chapterNumber,
    currentChapterTitle: entry.chapter?.title ?? null,
    totalChapters: entry.novel.chaptersCount,
    progressPercent: calculateProgressPercent(entry.chapterNumber, entry.novel.chaptersCount),
    updatedAt: entry.updatedAt.toISOString(),
  }))

  return {
    savedNovels: savedNovelDtos,
    continueReading: continueReadingDtos,
  }
}

function serializeBookmarkState(
  novelId: string,
  bookmark: { createdAt: Date } | null
): BookmarkState {
  return {
    novelId,
    isBookmarked: Boolean(bookmark),
    savedAt: bookmark?.createdAt.toISOString() ?? null,
  }
}

function serializeReadingProgressState(
  novelId: string,
  progress:
    | {
        chapterId: string | null
        chapterNumber: number
        updatedAt: Date
      }
    | null
): ReadingProgressState {
  return {
    novelId,
    chapterId: progress?.chapterId ?? null,
    chapterNumber: progress?.chapterNumber ?? null,
    updatedAt: progress?.updatedAt.toISOString() ?? null,
  }
}

export async function getBookmarkState(
  userId: string,
  novelIdentifier: string
): Promise<BookmarkState> {
  const novel = await findNovelByIdOrSlug(novelIdentifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const bookmark = await findNovelBookmarkForUser(userId, novel.id)
  return serializeBookmarkState(novel.id, bookmark)
}

export async function addBookmark(
  userId: string,
  novelIdentifier: string
): Promise<BookmarkState> {
  const novel = await findNovelByIdOrSlug(novelIdentifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const existingBookmark = await findNovelBookmarkForUser(userId, novel.id)
  const bookmark = await upsertNovelBookmarkForUser(userId, novel.id)
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "novel",
    novelId: novel.id,
    reason: "bookmark-added",
  })

  if (!existingBookmark && novel.authorId !== userId) {
    const notification = await createNotification({
      userId: novel.authorId,
      actorUserId: userId,
      type: "NOVEL_BOOKMARKED",
      novelId: novel.id,
      title: "New library save",
      message: `A reader added "${novel.title}" to their library.`,
      targetUrl: `/novel/${novel.id}`,
      metadata: {
        eventType: "NOVEL_BOOKMARKED",
      },
    })

    await enqueueNotificationDispatch(redis, {
      notificationId: notification.id,
    })
  }

  return serializeBookmarkState(novel.id, bookmark)
}

export async function removeBookmark(
  userId: string,
  novelIdentifier: string
): Promise<BookmarkState> {
  const novel = await findNovelByIdOrSlug(novelIdentifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  await deleteNovelBookmarkForUser(userId, novel.id)
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "novel",
    novelId: novel.id,
    reason: "bookmark-removed",
  })
  return serializeBookmarkState(novel.id, null)
}

export async function getReadingProgress(
  userId: string,
  novelIdentifier: string
): Promise<ReadingProgressState> {
  const novel = await findNovelByIdOrSlug(novelIdentifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const progress = await findReadingProgressForUserAndNovel(userId, novel.id)
  return serializeReadingProgressState(novel.id, progress)
}

export async function saveReadingProgress(
  userId: string,
  input: UpsertReadingProgressInput
): Promise<ReadingProgressState> {
  const novel = await findNovelByIdOrSlug(input.novelId)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  let chapterId = input.chapterId ?? null
  let chapterNumber = input.chapterNumber

  if (chapterId) {
    const chapter = await findChapterById(chapterId)
    if (!chapter || chapter.novelId !== novel.id) {
      throw new HttpError(404, "Chapter not found")
    }

    chapterNumber = chapter.number
    chapterId = chapter.id
  } else {
    const chapter = await findChapterForNovelByNumber(novel.id, input.chapterNumber)
    chapterId = chapter?.id ?? null
    chapterNumber = input.chapterNumber
  }

  const progress = await upsertReadingProgressForUser({
    userId,
    novelId: novel.id,
    chapterId,
    chapterNumber,
  })
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "novel",
    novelId: novel.id,
    reason: "reading-progress-saved",
  })

  return serializeReadingProgressState(novel.id, progress)
}

export async function removeReadingProgress(
  userId: string,
  novelIdentifier: string
) {
  const novel = await findNovelByIdOrSlug(novelIdentifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  await deleteReadingProgressForUserAndNovel(userId, novel.id)
  await enqueuePublicCatalogMetricsRefresh(redis, {
    scope: "novel",
    novelId: novel.id,
    reason: "reading-progress-removed",
  })
}

export async function clearReadingHistory(userId: string) {
  const currentEntries = await listReadingProgressForUser(userId)
  await clearReadingProgressForUser(userId)

  await Promise.all(
    [...new Set(currentEntries.map((entry) => entry.novelId))].map((novelId) =>
      enqueuePublicCatalogMetricsRefresh(redis, {
        scope: "novel",
        novelId,
        reason: "reading-history-cleared",
      })
    )
  )
}
