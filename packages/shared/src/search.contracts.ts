import { z } from "zod"
import {
  catalogPaginationSchema,
  publicCatalogFacetCountsSchema,
  publicCatalogQuerySchema,
} from "./catalog.contracts"

export const searchFilterTypeSchema = z.enum(["all", "novel", "author"])
export const searchSortBySchema = z.enum(["relevance", "popular", "recent"])

export const searchNovelResultSchema = z.object({
  id: z.string(),
  type: z.literal("novel"),
  slug: z.string(),
  title: z.string(),
  authorName: z.string(),
  authorNpub: z.string(),
  genre: z.string(),
  summary: z.string(),
  readsCount: z.number().int().nonnegative(),
  chaptersCount: z.number().int().nonnegative(),
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
})

export const searchAuthorResultSchema = z.object({
  id: z.string(),
  type: z.literal("author"),
  npub: z.string(),
  name: z.string(),
  bio: z.string(),
  followersCount: z.number().int().nonnegative(),
  novelsCount: z.number().int().nonnegative(),
  avatarUrl: z.string().nullable(),
})

export const searchResultItemSchema = z.discriminatedUnion("type", [
  searchNovelResultSchema,
  searchAuthorResultSchema,
])

export const searchResponseSchema = z.object({
  query: z.string(),
  filterType: searchFilterTypeSchema,
  sortBy: searchSortBySchema,
  total: z.number().int().nonnegative(),
  isApproximateTotal: z.boolean().optional(),
  pagination: catalogPaginationSchema,
  items: z.array(searchResultItemSchema),
  activeFilters: publicCatalogQuerySchema.optional(),
  facets: publicCatalogFacetCountsSchema.optional(),
})

export type SearchFilterType = z.infer<typeof searchFilterTypeSchema>
export type SearchSortBy = z.infer<typeof searchSortBySchema>
export type SearchNovelResultDto = z.infer<typeof searchNovelResultSchema>
export type SearchAuthorResultDto = z.infer<typeof searchAuthorResultSchema>
export type SearchResultItemDto = z.infer<typeof searchResultItemSchema>
export type SearchResponse = z.infer<typeof searchResponseSchema>
