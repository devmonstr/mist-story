import {
  countLibraryCollectionNovels,
  countFollowersForUsers,
  countLibraryCatalogNovels,
  countPublicNovelChapters,
  countPublishedNovelsForUsers,
  decimalToNumber,
  findAdjacentPublicChapterNumbers,
  findNovelBookmarkForUser,
  findReadingProgressForUserAndNovel,
  findPublicChapterForNovelByNumber,
  findPublicNovelByIdOrSlug,
  getPublicNovelChapterBounds,
  hexToNpub,
  listLibraryCatalogNovelsByCursor,
  listLibraryCollectionFacetCounts,
  listLibraryCatalogFacetCounts,
  listLibraryCatalogNovels,
  listPublicNovelChaptersPage,
  normalizeCatalogPagination,
  toIsoString,
} from "@myth/db"
import type {
  CatalogSortBy,
  LibraryCatalogResponse,
  PublicCatalogQuery,
  PublicCatalogSortBy,
  PublicNovelAuthorDto,
  PublicNovelChapterDto,
  PublicNovelChapterListDto,
  PublicNovelDetailDto,
  PublicNovelDetailResponse,
  PublicNovelReaderChapterDto,
  PublicNovelReaderResponse,
  PublicNovelViewerStateDto,
} from "@myth/shared"
import { getNovelGenreLabel, normalizeNovelGenreSlug } from "@myth/shared"
import {
  decodeLibraryCatalogCursor,
  encodeLibraryCatalogCursor,
} from "./catalog-cursor"
import { HttpError } from "../utils/http-error"
import { withPublicCache } from "./public-cache-service"

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

function normalizeGenreFilter(value: string | null | undefined) {
  if (!value?.trim()) {
    return null
  }

  return normalizeNovelGenreSlug(value) ?? value.trim()
}

function buildGenreFacet(value: string, count: number) {
  return {
    value: normalizeNovelGenreSlug(value) ?? value,
    label: getNovelGenreLabel(value),
    count,
  }
}

function resolveAuthorDisplayName(author: {
  displayName: string | null
  handle?: string | null
}) {
  return author.displayName?.trim() || author.handle?.trim() || "Unknown author"
}

function resolvePublicNovelCoverUrl(novel: {
  id: string
  coverUrl: string
  coverStorageKey: string | null
}) {
  return novel.coverStorageKey ? `/api/v1/novels/${novel.id}/cover` : novel.coverUrl
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
    genre: normalizeGenreFilter(input.genre) ?? undefined,
    workType: input.workType ?? "all",
    status: input.status ?? "all",
    collection: input.collection ?? "all",
    sort: normalizedSort,
    scope: "novel",
    page: input.page,
    pageSize: input.pageSize,
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

const PUBLIC_CHAPTER_LIST_PAGE_SIZE = 100

function normalizeChapterPage(page: number | undefined) {
  return Number.isFinite(page) && (page ?? 0) > 0 ? Math.floor(page as number) : 1
}

function resolveChapterListPage(chapterNumber: number, pageSize: number) {
  return Math.max(1, Math.ceil(chapterNumber / pageSize))
}

function buildPublicChapterListDto(input: {
  totalChapters: number
  currentPage: number
  pageSize: number
  maxChapterNumber: number
}): PublicNovelChapterListDto {
  const totalPages =
    input.maxChapterNumber === 0
      ? 0
      : Math.max(1, Math.ceil(input.maxChapterNumber / input.pageSize))
  const safeCurrentPage =
    totalPages === 0 ? 1 : Math.min(Math.max(1, input.currentPage), totalPages)
  const visibleFrom =
    input.maxChapterNumber === 0 ? 0 : (safeCurrentPage - 1) * input.pageSize + 1
  const visibleTo =
    input.maxChapterNumber === 0
      ? 0
      : Math.min(input.maxChapterNumber, safeCurrentPage * input.pageSize)

  return {
    totalChapters: input.totalChapters,
    maxChapterNumber: input.maxChapterNumber,
    currentPage: safeCurrentPage,
    pageSize: input.pageSize,
    totalPages,
    visibleFrom,
    visibleTo,
    hasPreviousPage: totalPages > 0 && safeCurrentPage > 1,
    hasNextPage: totalPages > 0 && safeCurrentPage < totalPages,
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
  publishedChapterCount: number
  chapters: PublicNovelChapterDto[]
}): PublicNovelDetailDto {
  const sampledWords = input.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  const totalWords =
    input.chapters.length === 0
      ? 0
      : input.chapters.length >= input.publishedChapterCount
        ? sampledWords
        : Math.round((sampledWords / input.chapters.length) * input.publishedChapterCount)

  return {
    id: input.novel.id,
    slug: input.novel.slug,
    title: input.novel.title,
    summary: input.novel.summary,
    genre: getNovelGenreLabel(input.novel.genre),
    workType: input.novel.workType,
    subgenres: input.novel.subgenres,
    tags: input.novel.tags,
    authorDisplayName: input.novel.authorDisplayName,
    translatorName: input.novel.translatorName,
    status: input.novel.status,
    visibility: input.novel.visibility,
    contentWarning: input.novel.contentWarning,
    updateNote: input.novel.updateNote,
    coverUrl: resolvePublicNovelCoverUrl(input.novel),
    coverStorageKey: null,
    chaptersCount: input.publishedChapterCount,
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

async function listLibraryCatalogUncached(input: {
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
  const genre = normalizeGenreFilter(input.genre)
  const workType = input.workType ?? null
  const status = input.status ?? null
  const collection = input.collection ?? null
  const supportsKeysetSort =
    sortBy === "recent" || sortBy === "popular" || sortBy === "rating" || sortBy === "title"
  const direction = input.direction ?? null
  const decodedCursor = supportsKeysetSort
    ? decodeLibraryCatalogCursor(input.cursor ?? undefined)
    : null
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
  let hasPreviousPage = false
  let hasNextPage = false

  if (collection) {
    const [collectionFacets, collectionTotal, collectionPage] = await Promise.all([
      listLibraryCollectionFacetCounts(collection, filters),
      countLibraryCollectionNovels(collection, filters),
      listLibraryCatalogNovelsByCursor(filters, {
        sortBy,
        pageSize: pagination.pageSize,
        cursor: decodedCursor,
        direction,
        collection,
      }),
    ])

    facetCounts = {
      ...collectionFacets,
      genres: collectionFacets.genres.map((item) => buildGenreFacet(item.value, item.count)),
    }
    catalogNovels = collectionPage.items
    totalItems = collectionTotal
    hasNextPage =
      direction === "prev" ? Boolean(decodedCursor) : collectionPage.hasMore
    hasPreviousPage =
      direction === "prev" ? collectionPage.hasMore : Boolean(decodedCursor)
  } else {
    const [aggregateFacetCounts, totalSource, novelsPage] = await Promise.all([
      listLibraryCatalogFacetCounts(filters),
      countLibraryCatalogNovels(filters),
      supportsKeysetSort
        ? listLibraryCatalogNovelsByCursor(filters, {
            sortBy,
            pageSize: pagination.pageSize,
            cursor: decodedCursor,
            direction,
          })
        : Promise.resolve(null),
    ])

    facetCounts = {
      total: aggregateFacetCounts.total,
      genres: aggregateFacetCounts.genres.map((item) =>
        buildGenreFacet(item.genre, item._count._all)
      ),
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
    if (novelsPage) {
      catalogNovels = novelsPage.items
      hasNextPage =
        direction === "prev" ? Boolean(decodedCursor) : novelsPage.hasMore
      hasPreviousPage =
        direction === "prev" ? novelsPage.hasMore : Boolean(decodedCursor)
    } else {
      const novels = await listLibraryCatalogNovels(filters, {
        sortBy,
        page: pagination.page,
        pageSize: pagination.pageSize,
      })
      catalogNovels = sortCatalogNovels(novels, sortBy, normalizedQuery)
      const totalPagesForFallback =
        totalSource > 0 ? Math.ceil(totalSource / pagination.pageSize) : 0
      hasPreviousPage = pagination.page > 1
      hasNextPage = totalPagesForFallback > pagination.page
    }
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
  const firstNovel = catalogNovels[0]
  const lastNovel = catalogNovels[catalogNovels.length - 1]
  const currentCursor = input.cursor ?? null
  const nextCursor =
    hasNextPage && lastNovel
      ? encodeLibraryCatalogCursor({
          sortBy,
          id: lastNovel.id,
          orderDate: (lastNovel.publishedAt ?? lastNovel.updatedAt).toISOString(),
          readsCount: lastNovel._count.readingProgress,
          bookmarksCount: lastNovel._count.bookmarks,
          ratingsCount: lastNovel.ratingsCount,
          rating: decimalToNumber(lastNovel.rating),
          title: lastNovel.title,
        })
      : null
  const previousCursor =
    hasPreviousPage && firstNovel
      ? encodeLibraryCatalogCursor({
          sortBy,
          id: firstNovel.id,
          orderDate: (firstNovel.publishedAt ?? firstNovel.updatedAt).toISOString(),
          readsCount: firstNovel._count.readingProgress,
          bookmarksCount: firstNovel._count.bookmarks,
          ratingsCount: firstNovel.ratingsCount,
          rating: decimalToNumber(firstNovel.rating),
          title: firstNovel.title,
        })
      : null

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
      direction,
    },
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      totalPages,
      currentCursor,
      nextCursor,
      previousCursor,
      hasPreviousPage,
      hasNextPage,
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
      genre: getNovelGenreLabel(novel.genre),
      workType: novel.workType,
      status: novel.status,
      visibility: novel.visibility,
      coverUrl: resolvePublicNovelCoverUrl(novel),
      coverStorageKey: null,
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
  return withPublicCache(
    "library",
    {
      query: input.query?.trim() || null,
      sortBy: input.sortBy ?? "recent",
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 18,
      cursor: input.cursor ?? null,
      direction: input.direction ?? null,
      genre: normalizeGenreFilter(input.genre),
      workType: input.workType ?? null,
      status: input.status ?? null,
      collection: input.collection ?? null,
    },
    () => listLibraryCatalogUncached(input)
  )
}

export async function getPublicNovelDetail(
  identifier: string,
  viewerUserId?: string,
  chapterPage?: number
): Promise<PublicNovelDetailResponse> {
  const novel = await findPublicNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const currentPage = normalizeChapterPage(chapterPage)
  const [publishedChapterCount, chapterBounds] = await Promise.all([
    countPublicNovelChapters(novel.id),
    getPublicNovelChapterBounds(novel.id),
  ])
  const chapterList = buildPublicChapterListDto({
    totalChapters: publishedChapterCount,
    currentPage,
    pageSize: PUBLIC_CHAPTER_LIST_PAGE_SIZE,
    maxChapterNumber: chapterBounds.maxChapterNumber,
  })

  const [chapters, author, viewer] = await Promise.all([
    listPublicNovelChaptersPage(
      novel.id,
      chapterList.currentPage,
      PUBLIC_CHAPTER_LIST_PAGE_SIZE
    ),
    buildAuthorDto(novel.author),
    getViewerState(viewerUserId, novel.id),
  ])

  const serializedChapters = chapters.map(serializePublicChapter)

  return {
    novel: buildNovelDetailDto({
      novel,
      publishedChapterCount,
      chapters: serializedChapters,
    }),
    author,
    chapterList,
    chapters: serializedChapters,
    viewer,
  }
}

export async function getPublicNovelChapter(
  identifier: string,
  chapterNumber: number,
  viewerUserId?: string,
  chapterPage?: number
): Promise<PublicNovelReaderResponse> {
  const novel = await findPublicNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const resolvedPage =
    chapterPage && chapterPage > 0
      ? normalizeChapterPage(chapterPage)
      : resolveChapterListPage(chapterNumber, PUBLIC_CHAPTER_LIST_PAGE_SIZE)
  const [publishedChapterCount, chapterBounds] = await Promise.all([
    countPublicNovelChapters(novel.id),
    getPublicNovelChapterBounds(novel.id),
  ])
  const chapterList = buildPublicChapterListDto({
    totalChapters: publishedChapterCount,
    currentPage: resolvedPage,
    pageSize: PUBLIC_CHAPTER_LIST_PAGE_SIZE,
    maxChapterNumber: chapterBounds.maxChapterNumber,
  })

  const [chapters, chapter, author, viewer, adjacentChapters] = await Promise.all([
    listPublicNovelChaptersPage(
      novel.id,
      chapterList.currentPage,
      PUBLIC_CHAPTER_LIST_PAGE_SIZE
    ),
    findPublicChapterForNovelByNumber(novel.id, chapterNumber),
    buildAuthorDto(novel.author),
    getViewerState(viewerUserId, novel.id),
    findAdjacentPublicChapterNumbers(novel.id, chapterNumber),
  ])

  if (!chapter?.latestPublishedVersion?.ciphertext) {
    throw new HttpError(404, "Chapter not found")
  }

  const serializedChapters = chapters.map(serializePublicChapter)
  const serializedCurrentChapter = serializePublicChapter(chapter)
  const readerChapter: PublicNovelReaderChapterDto = {
    ...serializedCurrentChapter,
    contentHtml: chapter.latestPublishedVersion.ciphertext,
    previousChapterNumber: adjacentChapters.previousChapterNumber,
    nextChapterNumber: adjacentChapters.nextChapterNumber,
  }

  return {
    novel: buildNovelDetailDto({
      novel,
      publishedChapterCount,
      chapters: serializedChapters,
    }),
    author,
    chapter: readerChapter,
    chapterList,
    chapters: serializedChapters,
    viewer,
  }
}
