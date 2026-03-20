import {
  countFollowersForUsers,
  countPublishedNovelsForUsers,
  decimalToNumber,
  findNovelBookmarkForUser,
  findReadingProgressForUserAndNovel,
  findPublicChapterForNovelByNumber,
  findPublicNovelByIdOrSlug,
  hexToNpub,
  listLibraryCatalogNovels,
  listPublicNovelChapters,
  toIsoString,
} from "@mist/db"
import type {
  LibraryCatalogResponse,
  PublicNovelAuthorDto,
  PublicNovelChapterDto,
  PublicNovelDetailDto,
  PublicNovelDetailResponse,
  PublicNovelReaderChapterDto,
  PublicNovelReaderResponse,
  PublicNovelViewerStateDto,
} from "@mist/shared"
import { HttpError } from "../utils/http-error"

function stripHtml(html: string) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function countWordsFromHtml(html: string) {
  const plainText = stripHtml(html)
  if (!plainText) {
    return 0
  }

  return plainText.split(/\s+/).filter(Boolean).length
}

function resolveAuthorDisplayName(author: {
  displayName: string | null
  handle?: string | null
}) {
  return author.displayName?.trim() || author.handle?.trim() || "Unknown author"
}

async function getViewerState(
  userId: string | undefined,
  novelId: string
): Promise<PublicNovelViewerStateDto> {
  if (!userId) {
    return {
      isBookmarked: false,
      currentChapterNumber: null,
    }
  }

  const [bookmark, progress] = await Promise.all([
    findNovelBookmarkForUser(userId, novelId),
    findReadingProgressForUserAndNovel(userId, novelId),
  ])

  return {
    isBookmarked: Boolean(bookmark),
    currentChapterNumber: progress?.chapterNumber ?? null,
  }
}

async function buildAuthorDto(author: {
  id: string
  pubkey: string
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  website: string | null
  lud16: string | null
}): Promise<PublicNovelAuthorDto> {
  const [followersMap, novelsMap] = await Promise.all([
    countFollowersForUsers([author.id]),
    countPublishedNovelsForUsers([author.id]),
  ])

  return {
    id: author.id,
    npub: hexToNpub(author.pubkey),
    displayName: resolveAuthorDisplayName(author),
    handle: author.handle ?? null,
    about: author.about ?? null,
    avatarUrl: author.avatarUrl ?? null,
    bannerUrl: author.bannerUrl ?? null,
    website: author.website ?? null,
    lud16: author.lud16 ?? null,
    followersCount: followersMap.get(author.id) ?? 0,
    publishedNovelsCount: novelsMap.get(author.id) ?? 0,
  }
}

function serializePublicChapter(chapter: {
  id: string
  number: number
  title: string
  publishedAt: Date | null
  price: { amountSats: number } | null
  latestPublishedVersion: {
    previewText: string
    ciphertext: string | null
  } | null
}): PublicNovelChapterDto {
  const contentHtml = chapter.latestPublishedVersion?.ciphertext ?? ""

  return {
    id: chapter.id,
    number: chapter.number,
    title: chapter.title,
    previewText: chapter.latestPublishedVersion?.previewText ?? "",
    wordCount: countWordsFromHtml(contentHtml),
    publishedAt: toIsoString(chapter.publishedAt),
    priceSats: chapter.price?.amountSats ?? null,
    isPaid: Boolean(chapter.price?.amountSats),
  }
}

function buildNovelDetailDto(input: {
  novel: {
    id: string
    slug: string
    title: string
    summary: string
    genre: string
    workType: "ORIGINAL" | "TRANSLATION"
    subgenres: string[]
    tags: string[]
    authorDisplayName: string
    translatorName: string
    status: "Ongoing" | "Completed" | "Hiatus"
    visibility: "PUBLISHED" | "HIDDEN"
    contentWarning: string
    updateNote: string
    coverUrl: string
    coverStorageKey: string | null
    chaptersCount: number
    rating: Parameters<typeof decimalToNumber>[0]
    ratingsCount: number
    publishedAt: Date | null
    updatedAt: Date
    _count: {
      bookmarks: number
      readingProgress: number
    }
  }
  chapters: PublicNovelChapterDto[]
}): PublicNovelDetailDto {
  const totalWords = input.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)

  return {
    id: input.novel.id,
    slug: input.novel.slug,
    title: input.novel.title,
    summary: input.novel.summary,
    genre: input.novel.genre,
    workType: input.novel.workType,
    subgenres: input.novel.subgenres,
    tags: input.novel.tags,
    authorDisplayName: input.novel.authorDisplayName,
    translatorName: input.novel.translatorName,
    status: input.novel.status,
    visibility: input.novel.visibility,
    contentWarning: input.novel.contentWarning,
    updateNote: input.novel.updateNote,
    coverUrl: input.novel.coverUrl,
    coverStorageKey: input.novel.coverStorageKey ?? null,
    chaptersCount: input.novel.chaptersCount,
    readsCount: input.novel._count.readingProgress,
    bookmarksCount: input.novel._count.bookmarks,
    rating: decimalToNumber(input.novel.rating),
    ratingsCount: input.novel.ratingsCount,
    totalWords,
    estimatedReadMinutes: Math.max(1, Math.ceil(totalWords / 250)),
    publishedAt: toIsoString(input.novel.publishedAt),
    updatedAt: input.novel.updatedAt.toISOString(),
  }
}

export async function listLibraryCatalog(query: string | undefined): Promise<LibraryCatalogResponse> {
  const normalizedQuery = query?.trim() ?? ""
  const novels = await listLibraryCatalogNovels(normalizedQuery)

  return {
    query: normalizedQuery,
    total: novels.length,
    novels: novels.map((novel) => ({
      id: novel.id,
      slug: novel.slug,
      title: novel.title,
      summary: novel.summary,
      genre: novel.genre,
      workType: novel.workType,
      status: novel.status,
      visibility: novel.visibility,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey ?? null,
      author: {
        id: novel.author.id,
        npub: hexToNpub(novel.author.pubkey),
        displayName:
          resolveAuthorDisplayName(novel.author) || novel.authorDisplayName || "Unknown author",
        avatarUrl: novel.author.avatarUrl ?? null,
      },
      chaptersCount: novel.chaptersCount,
      readsCount: novel._count.readingProgress,
      bookmarksCount: novel._count.bookmarks,
      rating: decimalToNumber(novel.rating),
      ratingsCount: novel.ratingsCount,
      publishedAt: toIsoString(novel.publishedAt),
      updatedAt: novel.updatedAt.toISOString(),
    })),
  }
}

export async function getPublicNovelDetail(
  identifier: string,
  viewerUserId?: string
): Promise<PublicNovelDetailResponse> {
  const novel = await findPublicNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const [chapters, author, viewer] = await Promise.all([
    listPublicNovelChapters(novel.id),
    buildAuthorDto(novel.author),
    getViewerState(viewerUserId, novel.id),
  ])

  const serializedChapters = chapters.map(serializePublicChapter)

  return {
    novel: buildNovelDetailDto({
      novel,
      chapters: serializedChapters,
    }),
    author,
    chapters: serializedChapters,
    viewer,
  }
}

export async function getPublicNovelChapter(
  identifier: string,
  chapterNumber: number,
  viewerUserId?: string
): Promise<PublicNovelReaderResponse> {
  const novel = await findPublicNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const [chapters, chapter, author, viewer] = await Promise.all([
    listPublicNovelChapters(novel.id),
    findPublicChapterForNovelByNumber(novel.id, chapterNumber),
    buildAuthorDto(novel.author),
    getViewerState(viewerUserId, novel.id),
  ])

  if (!chapter?.latestPublishedVersion?.ciphertext) {
    throw new HttpError(404, "Chapter not found")
  }

  const serializedChapters = chapters.map(serializePublicChapter)
  const currentIndex = serializedChapters.findIndex((item) => item.number === chapter.number)

  if (currentIndex < 0) {
    throw new HttpError(404, "Chapter not found")
  }

  const currentChapter = serializedChapters[currentIndex]
  const readerChapter: PublicNovelReaderChapterDto = {
    ...currentChapter,
    contentHtml: chapter.latestPublishedVersion.ciphertext,
    previousChapterNumber:
      serializedChapters[currentIndex - 1]?.number ?? null,
    nextChapterNumber:
      serializedChapters[currentIndex + 1]?.number ?? null,
  }

  return {
    novel: buildNovelDetailDto({
      novel,
      chapters: serializedChapters,
    }),
    author,
    chapter: readerChapter,
    chapters: serializedChapters,
    viewer,
  }
}
