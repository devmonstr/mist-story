import type { SearchFilterType, SearchResponse, SearchSortBy } from "@mist/shared"
import { fetchSearchResults } from "@/lib/api"

export type SearchResult = SearchResponse["items"][number]

export async function loadSearchResults(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  page?: number
  pageSize?: number
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}): Promise<SearchResponse> {
  const normalizedQuery = input.query.trim()

  if (!normalizedQuery) {
    return {
      query: "",
      filterType: input.filterType,
      sortBy: input.sortBy,
      total: 0,
      pagination: {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
        totalItems: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      items: [],
      activeFilters: undefined,
      facets: undefined,
    }
  }

  return fetchSearchResults({
    query: normalizedQuery,
    filterType: input.filterType,
    sortBy: input.sortBy,
    page: input.page ?? 1,
    pageSize: input.pageSize ?? 20,
    genre: input.genre ?? null,
    workType: input.workType ?? null,
    status: input.status ?? null,
  })
}
