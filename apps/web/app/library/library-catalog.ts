import type { CatalogSortBy } from "@mist/shared"
import * as api from "@/lib/api"

export interface LibraryCatalogNovel {
  id: string
  slug: string
  title: string
  summary: string
  workType: "ORIGINAL" | "TRANSLATION" | string
  status: "Ongoing" | "Completed" | "Hiatus" | string
  visibility: "PUBLISHED" | "HIDDEN" | string
  genre: string
  coverUrl: string
  coverStorageKey: string | null
  author: {
    id: string
    npub: string
    displayName: string | null
    avatarUrl: string | null
  }
  chaptersCount: number
  readsCount: number
  bookmarksCount: number
  rating: number
  ratingsCount: number
  publishedAt: string | null
  updatedAt: string
}

export interface LibraryCatalogResponse {
  novels: LibraryCatalogNovel[]
  total: number
  query: string
  filters: {
    query: string
    sortBy: CatalogSortBy
    genre: string | null
    workType: "ORIGINAL" | "TRANSLATION" | null
    status: "Ongoing" | "Completed" | "Hiatus" | null
    collection: "all" | "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
    page: number
    pageSize: number
  }
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  facets: {
    genres: Array<{ value: string; label: string; count: number }>
    workTypes: Array<{ value: string; label: string; count: number }>
    statuses: Array<{ value: string; label: string; count: number }>
  }
}

type CatalogApi = typeof api & {
  fetchLibraryCatalog?: (input?: {
    query?: string
    sortBy?: CatalogSortBy
    page?: number
    pageSize?: number
    genre?: string | null
    workType?: "ORIGINAL" | "TRANSLATION" | null
    status?: "Ongoing" | "Completed" | "Hiatus" | null
    collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  }) => Promise<unknown>
}

const catalogApi = api as CatalogApi

function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeFacetItems(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.map((item) => {
    const facet = (item ?? {}) as Record<string, unknown>

    return {
      value: normalizeString(facet.value),
      label: normalizeString(facet.label, normalizeString(facet.value)),
      count: normalizeNumber(facet.count),
    }
  })
}

function normalizeNovel(value: unknown): LibraryCatalogNovel {
  const novel = (value ?? {}) as Record<string, unknown>
  const author = (novel.author ?? {}) as Record<string, unknown>

  return {
    id: normalizeString(novel.id),
    slug: normalizeString(novel.slug, normalizeString(novel.id)),
    title: normalizeString(novel.title),
    summary: normalizeString(novel.summary),
    workType: normalizeString(novel.workType, "ORIGINAL"),
    status: normalizeString(novel.status, "Ongoing"),
    visibility: normalizeString(novel.visibility, "PUBLISHED"),
    genre: normalizeString(novel.genre, "Other"),
    coverUrl: normalizeString(novel.coverUrl, normalizeString(novel.cover, "")),
    coverStorageKey:
      typeof novel.coverStorageKey === "string" ? novel.coverStorageKey : null,
    author: {
      id: normalizeString(author.id, normalizeString(novel.authorId, "")),
      npub: normalizeString(author.npub),
      displayName:
        typeof author.displayName === "string"
          ? author.displayName
          : typeof novel.authorDisplayName === "string"
            ? novel.authorDisplayName
            : typeof novel.author === "string"
              ? novel.author
              : null,
      avatarUrl:
        typeof author.avatarUrl === "string"
          ? author.avatarUrl
          : typeof novel.authorAvatarUrl === "string"
            ? novel.authorAvatarUrl
            : null,
    },
    chaptersCount: normalizeNumber(novel.chaptersCount, normalizeNumber(novel.chapterCount)),
    readsCount: normalizeNumber(
      novel.readsCount,
      normalizeNumber(novel.reads, normalizeNumber(novel.totalReads))
    ),
    bookmarksCount: normalizeNumber(novel.bookmarksCount, normalizeNumber(novel.bookmarks)),
    rating: normalizeNumber(novel.rating, 0),
    ratingsCount: normalizeNumber(novel.ratingsCount, normalizeNumber(novel.ratingCount)),
    publishedAt:
      typeof novel.publishedAt === "string"
        ? novel.publishedAt
        : typeof novel.published_at === "string"
          ? novel.published_at
          : null,
    updatedAt: normalizeString(novel.updatedAt, new Date().toISOString()),
  }
}

export function normalizeLibraryCatalogResponse(
  input: unknown,
  query: string
): LibraryCatalogResponse {
  if (Array.isArray(input)) {
    const novels = input.map(normalizeNovel)
    return {
      novels,
      total: novels.length,
      query,
      filters: {
        query,
        sortBy: "recent",
        genre: null,
        workType: null,
        status: null,
        collection: null,
        page: 1,
        pageSize: novels.length || 20,
      },
      pagination: {
        page: 1,
        pageSize: novels.length || 20,
        totalItems: novels.length,
        totalPages: novels.length > 0 ? 1 : 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      facets: {
        genres: [],
        workTypes: [],
        statuses: [],
      },
    }
  }

  const response = (input ?? {}) as Record<string, unknown>
  const source =
    (Array.isArray(response.novels) && response.novels) ||
    (Array.isArray(response.items) && response.items) ||
    (Array.isArray(response.results) && response.results) ||
    []

  const novels = source.map(normalizeNovel)
  const total = normalizeNumber(
    response.total,
    normalizeNumber(response.count, novels.length)
  )

  return {
    novels,
    total,
    query: normalizeString(response.query, query),
    filters: {
      query: normalizeString((response.filters as Record<string, unknown> | undefined)?.query, query),
      sortBy:
        normalizeString(
          (response.filters as Record<string, unknown> | undefined)?.sortBy,
          "recent"
        ) as CatalogSortBy,
      genre:
        typeof (response.filters as Record<string, unknown> | undefined)?.genre === "string"
          ? normalizeString((response.filters as Record<string, unknown>).genre)
          : null,
      workType:
        typeof (response.filters as Record<string, unknown> | undefined)?.workType === "string"
          ? ((response.filters as Record<string, unknown>).workType as "ORIGINAL" | "TRANSLATION")
          : null,
      status:
        typeof (response.filters as Record<string, unknown> | undefined)?.status === "string"
          ? ((response.filters as Record<string, unknown>).status as "Ongoing" | "Completed" | "Hiatus")
          : null,
      collection:
        typeof (response.filters as Record<string, unknown> | undefined)?.collection === "string"
          ? ((response.filters as Record<string, unknown>).collection as
              | "all"
              | "trending"
              | "hidden-gems"
              | "editors-picks"
              | "new-voices")
          : null,
      page: normalizeNumber(
        (response.filters as Record<string, unknown> | undefined)?.page,
        1
      ),
      pageSize: normalizeNumber(
        (response.filters as Record<string, unknown> | undefined)?.pageSize,
        novels.length || 20
      ),
    },
    pagination: {
      page: normalizeNumber(
        (response.pagination as Record<string, unknown> | undefined)?.page,
        1
      ),
      pageSize: normalizeNumber(
        (response.pagination as Record<string, unknown> | undefined)?.pageSize,
        novels.length || 20
      ),
      totalItems: normalizeNumber(
        (response.pagination as Record<string, unknown> | undefined)?.totalItems,
        total
      ),
      totalPages: normalizeNumber(
        (response.pagination as Record<string, unknown> | undefined)?.totalPages,
        total > 0 ? 1 : 0
      ),
      hasPreviousPage: Boolean(
        (response.pagination as Record<string, unknown> | undefined)?.hasPreviousPage
      ),
      hasNextPage: Boolean(
        (response.pagination as Record<string, unknown> | undefined)?.hasNextPage
      ),
    },
    facets: {
      genres: normalizeFacetItems(
        (response.facets as Record<string, unknown> | undefined)?.genres
      ),
      workTypes: normalizeFacetItems(
        (response.facets as Record<string, unknown> | undefined)?.workTypes
      ),
      statuses: normalizeFacetItems(
        (response.facets as Record<string, unknown> | undefined)?.statuses
      ),
    },
  }
}

export async function loadLibraryCatalog(input: {
  query?: string
  sortBy?: CatalogSortBy
  page?: number
  pageSize?: number
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
} = {}) {
  if (!catalogApi.fetchLibraryCatalog) {
    throw new Error("Library catalog API is not available yet.")
  }

  const normalizedQuery = input.query?.trim() ?? ""
  const payload = await catalogApi.fetchLibraryCatalog({
    query: normalizedQuery || undefined,
    sortBy: input.sortBy,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 18,
    genre: input.genre ?? null,
    workType: input.workType ?? null,
    status: input.status ?? null,
    collection: input.collection ?? null,
  })
  return normalizeLibraryCatalogResponse(payload, normalizedQuery)
}
