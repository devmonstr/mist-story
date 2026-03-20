import {
  countLibraryCollectionNovels,
  hexToNpub,
  listLibraryCollectionNovels,
  listDiscoverGenres,
  listLibraryCatalogFacetCounts,
  normalizeCatalogPagination,
  searchAuthorsWithCursor,
  searchAuthorsWithPagination,
  searchPublishedNovelsWithCursor,
  searchPublishedNovelsWithPagination,
} from "@mist/db"
import type {
  DiscoverCollectionDto,
  DiscoverGenreDto,
  DiscoverResponse,
  PublicCatalogQuery,
  SearchAuthorResultDto,
  SearchFilterType,
  SearchNovelResultDto,
  SearchResponse,
  SearchResultItemDto,
  SearchSortBy,
} from "@mist/shared"
import {
  decodeCatalogCursor,
  decodeSearchAuthorCursor,
  decodeSearchNovelCursor,
  encodeCatalogCursor,
  encodeSearchAuthorCursor,
  encodeSearchNovelCursor,
} from "./catalog-cursor"

const GENRE_DESCRIPTIONS: Record<string, string> = {
  Fantasy: "Epic adventures, magic, and otherworldly realms.",
  Romance: "Love stories that touch the heart and inspire.",
  "Mystery & Thriller": "Suspenseful tales that keep you guessing until the end.",
  Mystery: "Suspenseful tales that keep you guessing until the end.",
  Thriller: "Suspenseful tales that keep you guessing until the end.",
  "Science Fiction": "Futuristic worlds and imaginative technology.",
  "Historical Fiction": "Stories set in fascinating periods of history.",
  "Literary Fiction": "Thoughtful narratives exploring the human condition.",
}

function buildGenreDescription(genre: string) {
  return GENRE_DESCRIPTIONS[genre] ?? "Discover stories and voices in this genre."
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

function serializeCollectionPreviewNovels(
  novels: Awaited<ReturnType<typeof listLibraryCollectionNovels>>
) {
  return novels.slice(0, 3).map((novel) => ({
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    coverUrl: novel.coverUrl,
    coverStorageKey: novel.coverStorageKey ?? null,
    genre: novel.genre,
    authorName:
      novel.author.displayName?.trim() || novel.author.handle?.trim() || "Unknown author",
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
    genre: input.genre?.trim() || undefined,
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
      value: item.genre,
      label: item.genre,
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

export async function getDiscoverData(input: {
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

  const [genres, facetCounts, trending, hiddenGems, editorsPicks, newVoices] = await Promise.all([
    listDiscoverGenres(filters),
    listLibraryCatalogFacetCounts(filters),
    listLibraryCollectionNovels("trending", filters, { page: 1, pageSize: 3 }),
    listLibraryCollectionNovels("hidden-gems", filters, { page: 1, pageSize: 3 }),
    listLibraryCollectionNovels("editors-picks", filters, { page: 1, pageSize: 3 }),
    listLibraryCollectionNovels("new-voices", filters, { page: 1, pageSize: 3 }),
  ])

  const [trendingCount, hiddenGemsCount, editorsPicksCount, newVoicesCount] = await Promise.all([
    countLibraryCollectionNovels("trending", filters),
    countLibraryCollectionNovels("hidden-gems", filters),
    countLibraryCollectionNovels("editors-picks", filters),
    countLibraryCollectionNovels("new-voices", filters),
  ])

  const discoverGenres: DiscoverGenreDto[] = genres.map((genre) => ({
    id: genre.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: genre.genre,
    description: buildGenreDescription(genre.genre),
    storiesCount: genre._count._all,
    href: buildLibraryHref({
      query: input.query,
      genre: genre.genre,
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
      storyCount: trendingCount,
      curator: "Mist Story Editors",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "trending",
      }),
      previewNovels: serializeCollectionPreviewNovels(trending),
    },
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      description: "Underrated stories that deserve more attention.",
      storyCount: hiddenGemsCount,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "hidden-gems",
      }),
      previewNovels: serializeCollectionPreviewNovels(hiddenGems),
    },
    {
      id: "editors-picks",
      title: "Editor's Picks",
      description: "Our favorite stories showcasing exceptional writing.",
      storyCount: editorsPicksCount,
      curator: "Mist Story Team",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "editors-picks",
      }),
      previewNovels: serializeCollectionPreviewNovels(editorsPicks),
    },
    {
      id: "new-voices",
      title: "New Voices",
      description: "First stories from fresh and exciting writers.",
      storyCount: newVoicesCount,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "new-voices",
      }),
      previewNovels: serializeCollectionPreviewNovels(newVoices),
    },
  ]

  return {
    genres: discoverGenres,
    collections,
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
  const query = input.query.trim()
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
    })
    const novelResults: SearchNovelResultDto[] = novels.items.map((novel) => ({
      id: novel.id,
      type: "novel",
      slug: novel.slug,
      title: novel.title,
      authorName: novel.authorName,
      authorNpub: hexToNpub(novel.authorPubkey),
      genre: novel.genre,
      summary: novel.summary,
      readsCount: novel.readsCount,
      chaptersCount: novel.chaptersCount,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey,
    }))
    const firstNovel = novels.items[0]
    const lastNovel = novels.items[novels.items.length - 1]
    const hasPreviousPage = direction === "prev" ? novels.hasMore : Boolean(novelCursor)
    const hasNextPage = direction === "prev" ? Boolean(novelCursor) : novels.hasMore

    return {
      query,
      filterType,
      sortBy,
      total: novels.total,
      pagination: {
        page: pagination.page,
        pageSize: novels.pageSize,
        totalItems: novels.total,
        totalPages: novels.total > 0 ? Math.ceil(novels.total / novels.pageSize) : 0,
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
      total: authors.total,
      pagination: {
        page: pagination.page,
        pageSize: authors.pageSize,
        totalItems: authors.total,
        totalPages: authors.total > 0 ? Math.ceil(authors.total / authors.pageSize) : 0,
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
    searchPublishedNovelsWithPagination(filters, query, sortBy, mixedPagination),
    searchAuthorsWithPagination(query, sortBy, mixedPagination),
    listLibraryCatalogFacetCounts(filters),
  ])

  const novelResults: SearchNovelResultDto[] = novels.items.map((novel) => ({
    id: novel.id,
    type: "novel",
    slug: novel.slug,
    title: novel.title,
    authorName: novel.authorName,
    authorNpub: hexToNpub(novel.authorPubkey),
    genre: novel.genre,
    summary: novel.summary,
    readsCount: novel.readsCount,
    chaptersCount: novel.chaptersCount,
    coverUrl: novel.coverUrl,
    coverStorageKey: novel.coverStorageKey,
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
  const total = novels.total + authors.total

  return {
    query,
    filterType,
    sortBy,
    total,
    pagination: {
      page: mixedPagination.page,
      pageSize: mixedPagination.pageSize,
      totalItems: total,
      totalPages: Math.max(
        novels.total > 0 ? Math.ceil(novels.total / mixedPagination.pageSize) : 0,
        authors.total > 0 ? Math.ceil(authors.total / mixedPagination.pageSize) : 0
      ),
      currentCursor: total > 0 ? input.cursor ?? encodeCatalogCursor(mixedPagination.page) : null,
      nextCursor:
        novels.total > mixedPagination.page * mixedPagination.pageSize ||
        authors.total > mixedPagination.page * mixedPagination.pageSize
          ? encodeCatalogCursor(mixedPagination.page)
          : null,
      previousCursor:
        mixedPagination.page > 1 ? encodeCatalogCursor(mixedPagination.page) : null,
      hasPreviousPage: mixedPagination.page > 1,
      hasNextPage:
        novels.total > mixedPagination.page * mixedPagination.pageSize ||
        authors.total > mixedPagination.page * mixedPagination.pageSize,
    },
    items,
    activeFilters: filters,
    facets: mapFacetCounts(facetCounts),
  }
}
