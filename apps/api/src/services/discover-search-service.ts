import {
  hexToNpub,
  listDiscoverCollectionsSnapshot,
  listLibraryCatalogFacetCounts,
  normalizeCatalogPagination,
  searchAuthorsWithCursor,
  searchAuthorsWithPagination,
  searchPublishedNovelsWithCursor,
  searchPublishedNovelsWithPagination,
} from "@myth/db"
import {
  getNovelGenreDescription,
  getNovelGenreLabel,
  normalizeNovelGenreSlug,
} from "@myth/shared"
import type {
  DiscoverCollectionDto,
  DiscoverGenreDto,
  DiscoverResponse,
  PublicCatalogQuery,
  SearchAuthorResultDto,
  SearchFilterType,
  SearchNovelResultDto,
  SearchResponse,
  SearchSortBy,
} from "@myth/shared"
import {
  decodeCatalogCursor,
  decodeSearchAuthorCursor,
  decodeSearchNovelCursor,
  encodeCatalogCursor,
  encodeSearchAuthorCursor,
  encodeSearchNovelCursor,
} from "./catalog-cursor"
import { withPublicCache } from "./public-cache-service"

const MAX_SEARCH_QUERY_LENGTH = 120

function normalizeSearchQuery(query: string) {
  return query.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_QUERY_LENGTH)
}

function normalizeGenreFilter(value: string | null | undefined) {
  if (!value?.trim()) {
    return null
  }

  return normalizeNovelGenreSlug(value) ?? value.trim()
}

function buildLibraryHref(input: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sort?: "relevance" | "popular" | "recent"
}) {
  const params = new URLSearchParams()

  if (input.query?.trim()) {
    params.set("q", input.query.trim())
  }
  if (input.genre?.trim()) {
    params.set("genre", input.genre.trim())
  }
  if (input.workType) {
    params.set("workType", input.workType)
  }
  if (input.status) {
    params.set("status", input.status)
  }
  if (input.collection) {
    params.set("collection", input.collection)
  }
  if (input.sort && input.sort !== "recent") {
    params.set("sort", input.sort)
  }

  const queryString = params.toString()
  return queryString ? `/library?${queryString}` : "/library"
}

function resolvePublicNovelCoverUrl(novel: {
  id: string
  coverUrl: string
  coverStorageKey: string | null
}) {
  return novel.coverStorageKey ? `/api/v1/novels/${novel.id}/cover` : novel.coverUrl
}

function serializeCollectionPreviewNovels(
  novels: Array<{
    id: string
    slug: string
    title: string
    summary: string
    coverUrl: string
    coverStorageKey: string | null
    genre: string
    workType: "ORIGINAL" | "TRANSLATION"
    status: "Ongoing" | "Completed" | "Hiatus"
    chaptersCount: number
    rating: number
    ratingsCount: number
    author: {
      displayName: string | null
      handle: string | null
    }
    _count: {
      readingProgress: number
      bookmarks: number
    }
  }>
) {
  return novels.slice(0, 4).map((novel) => ({
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    summary: novel.summary,
    coverUrl: resolvePublicNovelCoverUrl(novel),
    coverStorageKey: null,
    genre: getNovelGenreLabel(novel.genre),
    authorName:
      novel.author.displayName?.trim() || novel.author.handle?.trim() || "Unknown author",
    workType: novel.workType,
    status: novel.status,
    chaptersCount: novel.chaptersCount,
    readsCount: novel._count.readingProgress,
    bookmarksCount: novel._count.bookmarks,
    rating: Number(novel.rating),
    ratingsCount: novel.ratingsCount,
  }))
}

function buildPublicCatalogFilters(input: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sort?: "relevance" | "popular" | "recent"
  scope?: "all" | "novel" | "author"
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
}): PublicCatalogQuery {
  return {
    q: input.query?.trim() || undefined,
    genre: normalizeGenreFilter(input.genre) ?? undefined,
    workType: input.workType ?? "all",
    status: input.status ?? "all",
    collection: input.collection ?? "all",
    sort: input.sort ?? "recent",
    scope: input.scope ?? "all",
    page: input.page,
    pageSize: input.pageSize,
    cursor: input.cursor ?? undefined,
    direction: input.direction ?? undefined,
  }
}

function mapFacetCounts(facets: {
  total: number
  genres: Array<{ genre: string; _count: { _all: number } }>
  workTypes: Array<{ workType: string; _count: { _all: number } }>
  statuses: Array<{ status: string; _count: { _all: number } }>
}) {
  return {
    total: facets.total,
    genres: facets.genres.map((item) => ({
      value: normalizeNovelGenreSlug(item.genre) ?? item.genre,
      label: getNovelGenreLabel(item.genre),
      count: item._count._all,
    })),
    workTypes: facets.workTypes.map((item) => ({
      value: item.workType,
      label: item.workType === "TRANSLATION" ? "Translation" : "Original",
      count: item._count._all,
    })),
    statuses: facets.statuses.map((item) => ({
      value: item.status,
      label: item.status,
      count: item._count._all,
    })),
  }
}

async function getDiscoverDataUncached(input: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sort?: "relevance" | "popular" | "recent"
} = {}): Promise<DiscoverResponse> {
  const filters = buildPublicCatalogFilters({
    query: input.query,
    genre: input.genre,
    workType: input.workType,
    status: input.status,
    collection: input.collection,
    sort: input.sort,
    scope: "all",
  })

  const [facetCounts, collectionsSnapshot] = await Promise.all([
    listLibraryCatalogFacetCounts(filters),
    listDiscoverCollectionsSnapshot(filters),
  ])

  const discoverGenres: DiscoverGenreDto[] = facetCounts.genres.slice(0, 10).map((genre) => ({
    id:
      normalizeNovelGenreSlug(genre.genre) ??
      genre.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: getNovelGenreLabel(genre.genre),
    description: getNovelGenreDescription(genre.genre),
    storiesCount: genre._count._all,
    href: buildLibraryHref({
      query: input.query,
      genre: normalizeNovelGenreSlug(genre.genre) ?? genre.genre,
      workType: input.workType,
      status: input.status,
      sort: "popular",
    }),
  }))

  const collections: DiscoverCollectionDto[] = [
    {
      id: "trending",
      title: "Trending This Week",
      description: "The most-read stories gaining popularity right now.",
      storyCount: collectionsSnapshot.trending.total,
      curator: "Myth Story Editors",
      href: buildLibraryHref({
        query: input.query,
        genre: filters.genre,
        workType: input.workType,
        status: input.status,
        collection: "trending",
      }),
      previewNovels: serializeCollectionPreviewNovels(collectionsSnapshot.trending.novels),
    },
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      description: "Underrated stories that deserve more attention.",
      storyCount: collectionsSnapshot["hidden-gems"].total,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: filters.genre,
        workType: input.workType,
        status: input.status,
        collection: "hidden-gems",
      }),
      previewNovels: serializeCollectionPreviewNovels(collectionsSnapshot["hidden-gems"].novels),
    },
    {
      id: "editors-picks",
      title: "Editor's Picks",
      description: "Our favorite stories showcasing exceptional writing.",
      storyCount: collectionsSnapshot["editors-picks"].total,
      curator: "Myth Story Team",
      href: buildLibraryHref({
        query: input.query,
        genre: filters.genre,
        workType: input.workType,
        status: input.status,
        collection: "editors-picks",
      }),
      previewNovels: serializeCollectionPreviewNovels(collectionsSnapshot["editors-picks"].novels),
    },
    {
      id: "new-voices",
      title: "New Voices",
      description: "First stories from fresh and exciting writers.",
      storyCount: collectionsSnapshot["new-voices"].total,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: filters.genre,
        workType: input.workType,
        status: input.status,
        collection: "new-voices",
      }),
      previewNovels: serializeCollectionPreviewNovels(collectionsSnapshot["new-voices"].novels),
    },
  ]

  return {
    genres: discoverGenres,
    collections,
    activeFilters: filters,
    facets: mapFacetCounts(facetCounts),
  }
}

export async function getDiscoverData(input: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sort?: "relevance" | "popular" | "recent"
} = {}): Promise<DiscoverResponse> {
  return withPublicCache(
    "discover",
    {
      query: input.query?.trim() || null,
      genre: normalizeGenreFilter(input.genre),
      workType: input.workType ?? null,
      status: input.status ?? null,
      collection: input.collection ?? null,
      sort: input.sort ?? "recent",
    },
    () => getDiscoverDataUncached(input)
  )
}

async function searchCatalogUncached(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}): Promise<SearchResponse> {
  const query = normalizeSearchQuery(input.query)
  const filterType = input.filterType
  const sortBy = input.sortBy
  const direction = input.direction ?? null
  const pagination = normalizeCatalogPagination({
    page: input.page,
    pageSize: input.pageSize,
  })
  const filters = buildPublicCatalogFilters({
    query,
    genre: input.genre,
    workType: input.workType,
    status: input.status,
    sort: sortBy,
    scope: filterType,
    page: pagination.page,
    pageSize: pagination.pageSize,
    cursor: input.cursor ?? undefined,
    direction: input.direction ?? undefined,
  })

  if (!query) {
    return {
      query,
      filterType,
      sortBy,
      total: 0,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalItems: 0,
        totalPages: 0,
        currentCursor: null,
        nextCursor: null,
        previousCursor: null,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      items: [],
      activeFilters: filters,
      facets: mapFacetCounts({
        total: 0,
        genres: [],
        workTypes: [],
        statuses: [],
      }),
    }
  }

  const novelCursor = filterType === "novel" ? decodeSearchNovelCursor(input.cursor) : null
  const authorCursor = filterType === "author" ? decodeSearchAuthorCursor(input.cursor) : null
  const mixedCursorPage = filterType === "all" ? decodeCatalogCursor(input.cursor) : null
  const mixedPagination = normalizeCatalogPagination({
    page: mixedCursorPage
      ? Math.max(1, direction === "prev" ? mixedCursorPage - 1 : mixedCursorPage + 1)
      : input.page,
    pageSize: input.pageSize,
  })

  if (filterType === "novel") {
    const novels = await searchPublishedNovelsWithCursor(filters, query, sortBy, {
      pageSize: pagination.pageSize,
      cursor: novelCursor,
      direction,
    }, { includeTotal: false })
    const novelResults: SearchNovelResultDto[] = novels.items.map((novel) => ({
      id: novel.id,
      type: "novel",
      slug: novel.slug,
      title: novel.title,
      authorName: novel.authorName,
      authorNpub: hexToNpub(novel.authorPubkey),
      genre: getNovelGenreLabel(novel.genre),
      summary: novel.summary,
      readsCount: novel.readsCount,
      chaptersCount: novel.chaptersCount,
      coverUrl: resolvePublicNovelCoverUrl(novel),
      coverStorageKey: null,
    }))
    const firstNovel = novels.items[0]
    const lastNovel = novels.items[novels.items.length - 1]
    const hasPreviousPage = direction === "prev" ? novels.hasMore : Boolean(novelCursor)
    const hasNextPage = direction === "prev" ? Boolean(novelCursor) : novels.hasMore

    return {
      query,
      filterType,
      sortBy,
      total: novelResults.length,
      isApproximateTotal: true,
      pagination: {
        page: pagination.page,
        pageSize: novels.pageSize,
        totalItems: novelResults.length,
        totalPages: 0,
        currentCursor: input.cursor ?? null,
        nextCursor:
          hasNextPage && lastNovel
            ? encodeSearchNovelCursor({
                sortBy,
                id: lastNovel.id,
                readsCount: lastNovel.readsCount,
                bookmarksCount: lastNovel.bookmarksCount,
                ratingsCount: lastNovel.ratingsCount,
                orderDate: (lastNovel.publishedAt ?? lastNovel.updatedAt).toISOString(),
                rankScore: lastNovel.rankScore,
                similarityScore: lastNovel.similarityScore,
              })
            : null,
        previousCursor:
          hasPreviousPage && firstNovel
            ? encodeSearchNovelCursor({
                sortBy,
                id: firstNovel.id,
                readsCount: firstNovel.readsCount,
                bookmarksCount: firstNovel.bookmarksCount,
                ratingsCount: firstNovel.ratingsCount,
                orderDate: (firstNovel.publishedAt ?? firstNovel.updatedAt).toISOString(),
                rankScore: firstNovel.rankScore,
                similarityScore: firstNovel.similarityScore,
              })
            : null,
        hasPreviousPage,
        hasNextPage,
      },
      items: novelResults,
      activeFilters: filters,
      facets: mapFacetCounts(await listLibraryCatalogFacetCounts(filters)),
    }
  }

  if (filterType === "author") {
    const authors = await searchAuthorsWithCursor(query, sortBy, {
      pageSize: pagination.pageSize,
      cursor: authorCursor,
      direction,
    })
    const authorResults: SearchAuthorResultDto[] = authors.items.map((author) => ({
      id: author.id,
      type: "author",
      npub: hexToNpub(author.pubkey),
      name: author.name,
      bio: author.bio ?? "",
      followersCount: author.followersCount,
      novelsCount: author.novelsCount,
      avatarUrl: author.avatarUrl ?? null,
    }))
    const firstAuthor = authors.items[0]
    const lastAuthor = authors.items[authors.items.length - 1]
    const hasPreviousPage = direction === "prev" ? authors.hasMore : Boolean(authorCursor)
    const hasNextPage = direction === "prev" ? Boolean(authorCursor) : authors.hasMore

    return {
      query,
      filterType,
      sortBy,
      total: authors.total ?? authorResults.length,
      pagination: {
        page: pagination.page,
        pageSize: authors.pageSize,
        totalItems: authors.total ?? authorResults.length,
        totalPages:
          authors.total && authors.total > 0 ? Math.ceil(authors.total / authors.pageSize) : 0,
        currentCursor: input.cursor ?? null,
        nextCursor:
          hasNextPage && lastAuthor
            ? encodeSearchAuthorCursor({
                sortBy,
                id: lastAuthor.id,
                followersCount: lastAuthor.followersCount,
                novelsCount: lastAuthor.novelsCount,
                updatedAt: lastAuthor.updatedAt.toISOString(),
                rankScore: lastAuthor.rankScore,
                similarityScore: lastAuthor.similarityScore,
              })
            : null,
        previousCursor:
          hasPreviousPage && firstAuthor
            ? encodeSearchAuthorCursor({
                sortBy,
                id: firstAuthor.id,
                followersCount: firstAuthor.followersCount,
                novelsCount: firstAuthor.novelsCount,
                updatedAt: firstAuthor.updatedAt.toISOString(),
                rankScore: firstAuthor.rankScore,
                similarityScore: firstAuthor.similarityScore,
              })
            : null,
        hasPreviousPage,
        hasNextPage,
      },
      items: authorResults,
      activeFilters: filters,
      facets: undefined,
    }
  }

  const [novels, authors, facetCounts] = await Promise.all([
    searchPublishedNovelsWithPagination(filters, query, sortBy, mixedPagination, {
      includeTotal: false,
    }),
    searchAuthorsWithPagination(query, sortBy, mixedPagination, {
      includeTotal: false,
    }),
    listLibraryCatalogFacetCounts(filters),
  ])

  const novelResults: SearchNovelResultDto[] = novels.items.map((novel) => ({
    id: novel.id,
    type: "novel",
    slug: novel.slug,
    title: novel.title,
    authorName: novel.authorName,
    authorNpub: hexToNpub(novel.authorPubkey),
    genre: getNovelGenreLabel(novel.genre),
    summary: novel.summary,
    readsCount: novel.readsCount,
    chaptersCount: novel.chaptersCount,
    coverUrl: resolvePublicNovelCoverUrl(novel),
    coverStorageKey: null,
  }))

  const authorResults: SearchAuthorResultDto[] = authors.items.map((author) => ({
    id: author.id,
    type: "author",
    npub: hexToNpub(author.pubkey),
    name: author.name,
    bio: author.bio ?? "",
    followersCount: author.followersCount,
    novelsCount: author.novelsCount,
    avatarUrl: author.avatarUrl ?? null,
  }))

  const items = [...novelResults, ...authorResults].sort((a, b) => {
      if (sortBy === "popular") {
        const aScore = a.type === "novel" ? a.readsCount : a.followersCount
        const bScore = b.type === "novel" ? b.readsCount : b.followersCount
        return bScore - aScore
      }

      if (a.type !== b.type) {
        return a.type === "novel" ? -1 : 1
      }

      return 0
    })
  const approximateTotal = items.length

  return {
    query,
    filterType,
    sortBy,
    total: approximateTotal,
    isApproximateTotal: true,
    pagination: {
      page: mixedPagination.page,
      pageSize: mixedPagination.pageSize,
      totalItems: approximateTotal,
      totalPages: 0,
      currentCursor: approximateTotal > 0 ? input.cursor ?? encodeCatalogCursor(mixedPagination.page) : null,
      nextCursor:
        novels.hasMore || authors.hasMore
          ? encodeCatalogCursor(mixedPagination.page)
          : null,
      previousCursor:
        mixedPagination.page > 1 ? encodeCatalogCursor(mixedPagination.page) : null,
      hasPreviousPage: mixedPagination.page > 1,
      hasNextPage: novels.hasMore || authors.hasMore,
    },
    items,
    activeFilters: filters,
    facets: mapFacetCounts(facetCounts),
  }
}

export async function searchCatalog(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}): Promise<SearchResponse> {
  const normalizedQuery = normalizeSearchQuery(input.query)

  if (!normalizedQuery) {
    return searchCatalogUncached({
      ...input,
      query: normalizedQuery,
    })
  }

  return withPublicCache(
    "search",
    {
      query: normalizedQuery,
      filterType: input.filterType,
      sortBy: input.sortBy,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      cursor: input.cursor ?? null,
      direction: input.direction ?? null,
      genre: normalizeGenreFilter(input.genre),
      workType: input.workType ?? null,
      status: input.status ?? null,
    },
    () =>
      searchCatalogUncached({
        ...input,
        query: normalizedQuery,
      })
  )
}
