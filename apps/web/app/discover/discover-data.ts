import type { DiscoverResponse } from "@myth/shared"
import { fetchDiscoverData } from "@/lib/api"

export type DiscoverCategory = DiscoverResponse["genres"][number]
export type DiscoverCollection = DiscoverResponse["collections"][number]

export interface DiscoverData {
  genres: DiscoverCategory[]
  collections: DiscoverCollection[]
  activeFilters?: DiscoverResponse["activeFilters"]
  facets?: DiscoverResponse["facets"]
}

export async function loadDiscoverData(input?: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sortBy?: "relevance" | "popular" | "recent"
}): Promise<DiscoverData> {
  const payload = await fetchDiscoverData(input)

  return {
    genres: payload.genres,
    collections: payload.collections,
    activeFilters: payload.activeFilters,
    facets: payload.facets,
  }
}
