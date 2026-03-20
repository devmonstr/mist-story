import type {
  PublicCatalogFacetCounts,
  SearchFilterType,
  SearchResultItemDto,
  SearchSortBy,
} from "@mist/shared"

export interface SearchPagination {
  currentCursor: string | null
  nextCursor: string | null
  previousCursor: string | null
  totalItems: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface SearchResponse {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  total: number
  pagination: SearchPagination
  items: SearchResultItemDto[]
  activeFilters?: {
    query: string
    filterType: SearchFilterType
    sortBy: SearchSortBy
    genre: string | null
    workType: "ORIGINAL" | "TRANSLATION" | null
    status: "Ongoing" | "Completed" | "Hiatus" | null
    cursor: string | null
    direction: "next" | "prev" | null
    pageSize: number
  }
  facets?: PublicCatalogFacetCounts
}

export type SearchResult = SearchResponse["items"][number]

type SearchDirection = "next" | "prev" | null

function normalizeCursor(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null
}

function normalizeDirection(value: unknown): SearchDirection {
  return value === "next" || value === "prev" ? value : null
}

function normalizeFacetCounts(value: unknown): PublicCatalogFacetCounts | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }

  const facets = value as Record<string, unknown>
  return {
    total:
      typeof facets.total === "number" && Number.isFinite(facets.total)
        ? facets.total
        : 0,
    genres: Array.isArray(facets.genres) ? (facets.genres as PublicCatalogFacetCounts["genres"]) : [],
    workTypes: Array.isArray(facets.workTypes)
      ? (facets.workTypes as PublicCatalogFacetCounts["workTypes"])
      : [],
    statuses: Array.isArray(facets.statuses)
      ? (facets.statuses as PublicCatalogFacetCounts["statuses"])
      : [],
  }
}

export async function loadSearchResults(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  cursor?: string | null
  direction?: SearchDirection
  pageSize?: number
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}): Promise<SearchResponse> {
  const normalizedQuery = input.query.trim()
  const pageSize = input.pageSize ?? 20

  if (!normalizedQuery) {
    return {
      query: "",
      filterType: input.filterType,
      sortBy: input.sortBy,
      total: 0,
      pagination: {
        currentCursor: null,
        nextCursor: null,
        previousCursor: null,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      items: [],
      activeFilters: undefined,
      facets: undefined,
    }
  }

  const params = new URLSearchParams()
  params.set("q", normalizedQuery)
  if (input.filterType !== "all") {
    params.set("type", input.filterType)
  }
  if (input.sortBy !== "relevance") {
    params.set("sort", input.sortBy)
  }
  params.set("pageSize", String(pageSize))

  if (input.cursor) {
    params.set("cursor", input.cursor)
  }
  if (input.direction) {
    params.set("direction", input.direction)
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

  const response = await fetch(`/api/v1/discover/search?${params.toString()}`)
  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null

  if (!response.ok) {
    const errorMessage =
      typeof payload?.error === "string"
        ? payload.error
        : typeof payload?.message === "string"
          ? payload.message
          : "Failed to load search results."
    throw new Error(errorMessage)
  }

  const items = Array.isArray(payload?.items) ? (payload?.items as SearchResultItemDto[]) : []
  const pagination = (payload?.pagination ?? {}) as Record<string, unknown>
  const activeFilters = (payload?.activeFilters ?? {}) as Record<string, unknown>

  return {
    query: typeof payload?.query === "string" ? payload.query : normalizedQuery,
    filterType:
      payload?.filterType === "novel" || payload?.filterType === "author"
        ? payload.filterType
        : input.filterType,
    sortBy:
      payload?.sortBy === "relevance" ||
      payload?.sortBy === "popular" ||
      payload?.sortBy === "recent"
        ? payload.sortBy
        : input.sortBy,
    total:
      typeof payload?.total === "number" && Number.isFinite(payload.total) ? payload.total : items.length,
    pagination: {
      currentCursor: normalizeCursor(pagination.currentCursor),
      nextCursor: normalizeCursor(pagination.nextCursor),
      previousCursor: normalizeCursor(pagination.previousCursor),
      totalItems:
        typeof pagination.totalItems === "number" && Number.isFinite(pagination.totalItems)
          ? pagination.totalItems
          : items.length,
      hasPreviousPage: Boolean(pagination.hasPreviousPage),
      hasNextPage: Boolean(pagination.hasNextPage),
    },
    items,
    activeFilters: {
      query: typeof activeFilters.query === "string" ? activeFilters.query : normalizedQuery,
      filterType:
        activeFilters.filterType === "novel" || activeFilters.filterType === "author"
          ? activeFilters.filterType
          : input.filterType,
      sortBy:
        activeFilters.sortBy === "relevance" ||
        activeFilters.sortBy === "popular" ||
        activeFilters.sortBy === "recent"
          ? activeFilters.sortBy
          : input.sortBy,
      genre: typeof activeFilters.genre === "string" ? activeFilters.genre : null,
      workType:
        activeFilters.workType === "ORIGINAL" || activeFilters.workType === "TRANSLATION"
          ? activeFilters.workType
          : null,
      status:
        activeFilters.status === "Ongoing" ||
        activeFilters.status === "Completed" ||
        activeFilters.status === "Hiatus"
          ? activeFilters.status
          : null,
      cursor: normalizeCursor(activeFilters.cursor),
      direction: normalizeDirection(activeFilters.direction),
      pageSize:
        typeof activeFilters.pageSize === "number" && Number.isFinite(activeFilters.pageSize)
          ? activeFilters.pageSize
          : pageSize,
    },
    facets: normalizeFacetCounts(payload?.facets),
  }
}
