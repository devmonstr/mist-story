import type { CatalogSortBy } from "@mist/shared"

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
    cursor: string | null
    direction: "next" | "prev" | null
    pageSize: number
  }
  pagination: {
    currentCursor: string | null
    nextCursor: string | null
    previousCursor: string | null
    totalItems: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  facets: {
    genres: Array<{ value: string; label: string; count: number }>
    workTypes: Array<{ value: string; label: string; count: number }>
    statuses: Array<{ value: string; label: string; count: number }>
  }
}

type LibraryCatalogDirection = "next" | "prev" | null

function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeCursor(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function normalizeDirection(value: unknown): LibraryCatalogDirection {
  return value === "next" || value === "prev" ? value : null
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
        cursor: null,
        direction: null,
        pageSize: novels.length || 20,
      },
      pagination: {
        currentCursor: null,
        nextCursor: null,
        previousCursor: null,
        totalItems: novels.length,
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
      cursor: normalizeCursor(
        (response.filters as Record<string, unknown> | undefined)?.cursor
      ),
      direction: normalizeDirection(
        (response.filters as Record<string, unknown> | undefined)?.direction
      ),
      pageSize: normalizeNumber(
        (response.filters as Record<string, unknown> | undefined)?.pageSize,
        novels.length || 20
      ),
    },
    pagination: {
      currentCursor: normalizeCursor(
        (response.pagination as Record<string, unknown> | undefined)?.currentCursor
      ),
      nextCursor: normalizeCursor(
        (response.pagination as Record<string, unknown> | undefined)?.nextCursor
      ),
      previousCursor: normalizeCursor(
        (response.pagination as Record<string, unknown> | undefined)?.previousCursor
      ),
      totalItems: normalizeNumber(
        (response.pagination as Record<string, unknown> | undefined)?.totalItems,
        total
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
  cursor?: string | null
  direction?: LibraryCatalogDirection
  pageSize?: number
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
} = {}) {
  const normalizedQuery = input.query?.trim() ?? ""
  const params = new URLSearchParams()

  if (normalizedQuery) {
    params.set("q", normalizedQuery)
  }
  if (input.sortBy) {
    params.set("sort", input.sortBy)
  }
  if (input.cursor) {
    params.set("cursor", input.cursor)
  }
  if (input.direction) {
    params.set("direction", input.direction)
  }
  params.set("pageSize", String(input.pageSize ?? 18))
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

  const response = await fetch(`/api/v1/library${params.toString() ? `?${params}` : ""}`)
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const errorMessage =
      (payload as { error?: string; message?: string } | null)?.error ||
      (payload as { error?: string; message?: string } | null)?.message ||
      "Failed to load the library catalog."
    throw new Error(errorMessage)
  }

  return normalizeLibraryCatalogResponse(payload, normalizedQuery)
}
