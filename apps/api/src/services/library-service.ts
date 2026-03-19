import {
  listBookmarkedNovelsForUser,
  listReadingProgressForUser,
} from "@mist/db"
import type {
  MyLibraryContinueReadingDto,
  MyLibraryResponse,
  MyLibrarySavedNovelDto,
} from "@mist/shared"

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

    return {
      novelId: bookmark.novel.id,
      slug: bookmark.novel.slug,
      title: bookmark.novel.title,
      authorDisplayName: bookmark.novel.authorDisplayName,
      genre: bookmark.novel.genre,
      summary: bookmark.novel.summary,
      coverUrl: bookmark.novel.coverUrl,
      savedAt: bookmark.createdAt.toISOString(),
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
