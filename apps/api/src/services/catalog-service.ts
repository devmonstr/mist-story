import {
  countLibraryCollectionNovels,
  countFollowersForUsers,
  countLibraryCatalogNovels,
  countPublishedNovelsForUsers,
  decimalToNumber,
  findNovelBookmarkForUser,
  findReadingProgressForUserAndNovel,
  findPublicChapterForNovelByNumber,
  findPublicNovelByIdOrSlug,
  hexToNpub,
  listLibraryCollectionFacetCounts,
  listLibraryCollectionNovels,
  listLibraryCatalogFacetCounts,
  listLibraryCatalogNovels,
  listPublicNovelChapters,
  normalizeCatalogPagination,
  toIsoString,
} from "@mist/db"
import type {
  CatalogSortBy,
  LibraryCatalogResponse,
  PublicCatalogQuery,
  PublicCatalogSortBy,
  PublicNovelAuthorDto,
  PublicNovelChapterDto,
  PublicNovelDetailDto,
  PublicNovelDetailResponse,
  PublicNovelReaderChapterDto,
  PublicNovelReaderResponse,
  PublicNovelViewerStateDto,
} from "@mist/shared"
import { encodeCatalogCursor } from "./catalog-cursor"
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

function sortCatalogNovels(
  novels: Awaited<ReturnType<typeof listLibraryCatalogNovels>>,
  sortBy: CatalogSortBy | PublicCatalogSortBy,
  query: string
) {
  const items = [...novels]

  if (sortBy === "popular") {
    return items.sort((a, b) => {
      if (b._count.readingProgress !== a._count.readingProgress) {
        return b._count.readingProgress - a._count.readingProgress
      }

      if (b._count.bookmarks !== a._count.bookmarks) {
        return b._count.bookmarks - a._count.bookmarks
      }

      return b.ratingsCount - a.ratingsCount
    })
  }

  if (sortBy === "rating") {
    return items.sort((a, b) => {
      if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
        return decimalToNumber(b.rating) - decimalToNumber(a.rating)
      }

      if (b.ratingsCount !== a.ratingsCount) {
        return b.ratingsCount - a.ratingsCount
      }

      return b._count.readingProgress - a._count.readingProgress
    })
  }

  if (sortBy === "title") {
    return items.sort((a, b) => a.title.localeCompare(b.title))
  }

  if (sortBy === "relevance") {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return items.sort((a, b) => {
        const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
        const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
        return right - left
      })
    }

    return items.sort((a, b) => {
      const scoreA =
        scoreTextMatch(normalizedQuery, a.title) * 3 +
        scoreTextMatch(normalizedQuery, a.summary) * 2 +
        scoreTextMatch(normalizedQuery, a.genre) +
        scoreTextMatch(normalizedQuery, a.author.displayName)
      const scoreB =
        scoreTextMatch(normalizedQuery, b.title) * 3 +
        scoreTextMatch(normalizedQuery, b.summary) * 2 +
        scoreTextMatch(normalizedQuery, b.genre) +
        scoreTextMatch(normalizedQuery, b.author.displayName)

      if (scoreB !== scoreA) {
        return scoreB - scoreA
      }

      if (b._count.readingProgress !== a._count.readingProgress) {
        return b._count.readingProgress - a._count.readingProgress
      }

      return b.ratingsCount - a.ratingsCount
    })
  }

  return items.sort((a, b) => {
    const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
    const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
    return right - left
  })
}

function scoreTextMatch(query: string, value: string | null | undefined) {
  const normalizedValue = (value ?? "").toLowerCase()

  if (normalizedValue === query) {
    return 120
  }

  if (normalizedValue.startsWith(query)) {
    return 80
  }

  if (normalizedValue.includes(query)) {
    return 40
  }

  return 0
}

function buildPublicCatalogFilters(input: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sortBy?: CatalogSortBy | PublicCatalogSortBy
  page?: number
  pageSize?: number
}): PublicCatalogQuery {
  const sort = input.sortBy ?? "recent"
  const normalizedSort =
    sort === "popular" || sort === "recent" || sort === "relevance" ? sort : "recent"

  return {
    q: input.query?.trim() || undefined,
    genre: input.genre?.trim() || undefined,
    workType: input.workType ?? "all",
    status: input.status ?? "all",
    collection: input.collection ?? "all",
    sort: normalizedSort,
    scope: "novel",
    page: input.page,
    pageSize: input.pageSize,
  }
}

function buildCatalogFacetCounts(
  novels: Awaited<ReturnType<typeof listLibraryCatalogNovels>>
) {
  const genreCounts = new Map<string, number>()
  const workTypeCounts = new Map<"ORIGINAL" | "TRANSLATION", number>()
  const statusCounts = new Map<"Ongoing" | "Completed" | "Hiatus", number>()

  for (const novel of novels) {
    genreCounts.set(novel.genre, (genreCounts.get(novel.genre) ?? 0) + 1)
    workTypeCounts.set(novel.workType, (workTypeCounts.get(novel.workType) ?? 0) + 1)
    statusCounts.set(novel.status, (statusCounts.get(novel.status) ?? 0) + 1)
  }

  return {
    total: novels.length,
    genres: [...genreCounts.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    workTypes: [...workTypeCounts.entries()]
      .map(([value, count]) => ({
        value,
        label: value === "TRANSLATION" ? "Translation" : "Original",
        count,
      }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    statuses: [...statusCounts.entries()]
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
  }
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

type LibraryCatalogNovelSource = {
  id: string
  slug: string
  title: string
  summary: string
  genre: string
  workType: "ORIGINAL" | "TRANSLATION"
  status: "Ongoing" | "Completed" | "Hiatus"
  visibility: "PUBLISHED" | "HIDDEN"
  coverUrl: string
  coverStorageKey: string | null
  authorDisplayName: string | null
  chaptersCount: number
  rating: Parameters<typeof decimalToNumber>[0]
  ratingsCount: number
  publishedAt: Date | null
  updatedAt: Date
  author: {
    id: string
    pubkey: string
    displayName: string | null
    handle: string | null
    avatarUrl: string | null
  }
  _count: {
    readingProgress: number
    bookmarks: number
  }
}

export async function listLibraryCatalog(input: {
  query?: string
  sortBy?: CatalogSortBy | PublicCatalogSortBy
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
}): Promise<LibraryCatalogResponse> {
  const normalizedQuery = input.query?.trim() ?? ""
  const sortBy = input.sortBy ?? "recent"
  const genre = input.genre?.trim() ? input.genre.trim() : null
  const workType = input.workType ?? null
  const status = input.status ?? null
  const collection = input.collection ?? null
  const pagination = normalizeCatalogPagination({
    page: input.page,
    pageSize: input.pageSize,
  })

  const filters = {
    query: normalizedQuery,
    genre,
    workType,
    status,
  }

  let facetCounts: {
    total: number
    genres: Array<{ value: string; label: string; count: number }>
    workTypes: Array<{ value: string; label: string; count: number }>
      statuses: Array<{ value: string; label: string; count: number }>
  }
  let catalogNovels: LibraryCatalogNovelSource[]
  let totalItems: number

  if (collection) {
    const [collectionFacets, collectionNovels, collectionTotal] = await Promise.all([
      listLibraryCollectionFacetCounts(collection, filters),
      listLibraryCollectionNovels(collection, filters, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
      countLibraryCollectionNovels(collection, filters),
    ])

    facetCounts = collectionFacets
    catalogNovels = collectionNovels
    totalItems = collectionTotal
  } else {
    const [novels, aggregateFacetCounts, totalSource] = await Promise.all([
      listLibraryCatalogNovels(filters, {
        sortBy,
        page: pagination.page,
        pageSize: pagination.pageSize,
      }),
      listLibraryCatalogFacetCounts(filters),
      countLibraryCatalogNovels(filters),
    ])

    facetCounts = {
      total: aggregateFacetCounts.total,
      genres: aggregateFacetCounts.genres.map((item) => ({
        value: item.genre,
        label: item.genre,
        count: item._count._all,
      })),
      workTypes: aggregateFacetCounts.workTypes.map((item) => ({
        value: item.workType,
        label: item.workType === "TRANSLATION" ? "Translation" : "Original",
        count: item._count._all,
      })),
      statuses: aggregateFacetCounts.statuses.map((item) => ({
        value: item.status,
        label: item.status,
        count: item._count._all,
      })),
    }
    catalogNovels = sortCatalogNovels(novels, sortBy, normalizedQuery)
    totalItems = totalSource
  }

  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pagination.pageSize) : 0
  const publicFilters = buildPublicCatalogFilters({
    query: normalizedQuery,
    genre,
    workType,
    status,
    collection,
    sortBy,
    page: pagination.page,
    pageSize: pagination.pageSize,
  })
  const currentCursor = totalItems > 0 ? encodeCatalogCursor(pagination.page) : null
  const nextCursor = totalPages > pagination.page ? currentCursor : null
  const previousCursor = pagination.page > 1 ? currentCursor : null

  return {
    query: normalizedQuery,
    total: totalItems,
    filters: {
      query: normalizedQuery,
      sortBy,
      genre,
      workType,
      status,
      collection: collection ?? "all",
      page: pagination.page,
      pageSize: pagination.pageSize,
      cursor: currentCursor,
      direction: null,
    },
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      totalPages,
      currentCursor,
      nextCursor,
      previousCursor,
      hasPreviousPage: pagination.page > 1,
      hasNextPage: totalPages > pagination.page,
    },
    facets: {
      genres: facetCounts.genres,
      workTypes: facetCounts.workTypes,
      statuses: facetCounts.statuses,
    },
    activeFilters: publicFilters,
    publicFacets: {
      total: facetCounts.total,
      genres: facetCounts.genres,
      workTypes: facetCounts.workTypes,
      statuses: facetCounts.statuses,
    },
    novels: catalogNovels.map((novel) => ({
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
