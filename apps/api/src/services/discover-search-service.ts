import {
  hexToNpub,
  listDiscoverCollectionNovels,
  listDiscoverGenres,
  listLibraryCatalogFacetCounts,
  normalizeCatalogPagination,
  searchAuthorsWithPagination,
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
import { applyCatalogCollection } from "./public-catalog-utils"

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

  const [genres, novels, facetCounts] = await Promise.all([
    listDiscoverGenres(filters),
    listDiscoverCollectionNovels(filters),
    listLibraryCatalogFacetCounts(filters),
  ])

  const [trending, hiddenGems, editorsPicks, newVoices] = await Promise.all([
    applyCatalogCollection(novels, "trending"),
    applyCatalogCollection(novels, "hidden-gems"),
    applyCatalogCollection(novels, "editors-picks"),
    applyCatalogCollection(novels, "new-voices"),
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
      storyCount: trending.length,
      curator: "Mist Story Editors",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "trending",
      }),
    },
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      description: "Underrated stories that deserve more attention.",
      storyCount: hiddenGems.length,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "hidden-gems",
      }),
    },
    {
      id: "editors-picks",
      title: "Editor's Picks",
      description: "Our favorite stories showcasing exceptional writing.",
      storyCount: editorsPicks.length,
      curator: "Mist Story Team",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "editors-picks",
      }),
    },
    {
      id: "new-voices",
      title: "New Voices",
      description: "First stories from fresh and exciting writers.",
      storyCount: newVoices.length,
      curator: "Community",
      href: buildLibraryHref({
        query: input.query,
        genre: input.genre,
        workType: input.workType,
        status: input.status,
        collection: "new-voices",
      }),
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
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}): Promise<SearchResponse> {
  const query = input.query.trim()
  const filterType = input.filterType
  const sortBy = input.sortBy
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

  const shouldLoadNovels = filterType === "all" || filterType === "novel"
  const shouldLoadAuthors = filterType === "all" || filterType === "author"

  const [novels, authors] = await Promise.all([
    shouldLoadNovels
      ? searchPublishedNovelsWithPagination(filters, query, sortBy, pagination)
      : Promise.resolve({
          items: [],
          total: 0,
          pagination,
        }),
    shouldLoadAuthors
      ? searchAuthorsWithPagination(query, sortBy, pagination)
      : Promise.resolve({
          items: [],
          total: 0,
          pagination,
        }),
  ])
  const facetCounts = shouldLoadNovels ? await listLibraryCatalogFacetCounts(filters) : null

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

  let items: SearchResultItemDto[] = []
  let total = 0
  let responsePagination = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalItems: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  }

  if (filterType === "novel") {
    items = novelResults
    total = novels.total
    responsePagination = {
      page: novels.pagination.page,
      pageSize: novels.pagination.pageSize,
      totalItems: novels.total,
      totalPages: novels.total > 0 ? Math.ceil(novels.total / novels.pagination.pageSize) : 0,
      hasPreviousPage: novels.pagination.page > 1,
      hasNextPage:
        novels.total > novels.pagination.page * novels.pagination.pageSize,
    }
  } else if (filterType === "author") {
    items = authorResults
    total = authors.total
    responsePagination = {
      page: authors.pagination.page,
      pageSize: authors.pagination.pageSize,
      totalItems: authors.total,
      totalPages: authors.total > 0 ? Math.ceil(authors.total / authors.pagination.pageSize) : 0,
      hasPreviousPage: authors.pagination.page > 1,
      hasNextPage:
        authors.total > authors.pagination.page * authors.pagination.pageSize,
    }
  } else {
    items = [...novelResults, ...authorResults].sort((a, b) => {
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
    total = novels.total + authors.total
    responsePagination = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: total,
      totalPages: Math.max(
        novels.total > 0 ? Math.ceil(novels.total / pagination.pageSize) : 0,
        authors.total > 0 ? Math.ceil(authors.total / pagination.pageSize) : 0
      ),
      hasPreviousPage: pagination.page > 1,
      hasNextPage:
        novels.total > pagination.page * pagination.pageSize ||
        authors.total > pagination.page * pagination.pageSize,
    }
  }

  return {
    query,
    filterType,
    sortBy,
    total,
    pagination: responsePagination,
    items,
    activeFilters: filters,
    facets: facetCounts ? mapFacetCounts(facetCounts) : undefined,
  }
}
