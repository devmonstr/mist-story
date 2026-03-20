import type { SearchFilterType, SearchResponse, SearchSortBy } from "@mist/shared"
import { fetchSearchResults } from "@/lib/api"

export type SearchResult = SearchResponse["items"][number]

export async function loadSearchResults(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
}): Promise<SearchResponse> {
  const normalizedQuery = input.query.trim()

  if (!normalizedQuery) {
    return {
      query: "",
      filterType: input.filterType,
      sortBy: input.sortBy,
      total: 0,
      items: [],
    }
  }

  return fetchSearchResults({
    query: normalizedQuery,
    filterType: input.filterType,
    sortBy: input.sortBy,
  })
}
