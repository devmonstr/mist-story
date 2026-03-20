import type { DiscoverResponse } from "@mist/shared"
import { fetchDiscoverData } from "@/lib/api"

export type DiscoverCategory = DiscoverResponse["genres"][number]
export type DiscoverCollection = DiscoverResponse["collections"][number]

export interface DiscoverData {
  genres: DiscoverCategory[]
  collections: DiscoverCollection[]
}

let discoverDataPromise: Promise<DiscoverData> | null = null

export async function loadDiscoverData(): Promise<DiscoverData> {
  if (!discoverDataPromise) {
    discoverDataPromise = fetchDiscoverData()
      .then((payload) => ({
        genres: payload.genres,
        collections: payload.collections,
      }))
      .catch((error) => {
        discoverDataPromise = null
        throw error
      })
  }

  return discoverDataPromise
}
