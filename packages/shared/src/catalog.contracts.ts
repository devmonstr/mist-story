import { z } from "zod"
import {
  novelStatusSchema,
  novelVisibilitySchema,
  novelWorkTypeSchema,
} from "./novel.contracts"
import { normalizeNovelGenreSlug } from "./genres"

export const catalogSortBySchema = z.enum([
  "relevance",
  "recent",
  "popular",
  "rating",
  "title",
])

export const publicCatalogScopeSchema = z.enum(["all", "novel", "author"])
export const publicCatalogSortBySchema = z.enum(["relevance", "popular", "recent"])
export const publicCatalogGenreFilterSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => normalizeNovelGenreSlug(value) ?? value)
  .optional()
export const publicCatalogWorkTypeFilterSchema = z.enum([
  "all",
  "ORIGINAL",
  "TRANSLATION",
])
export const publicCatalogStatusFilterSchema = z.enum([
  "all",
  "Ongoing",
  "Completed",
  "Hiatus",
])
export const publicCatalogCollectionFilterSchema = z.enum([
  "all",
  "trending",
  "hidden-gems",
  "editors-picks",
  "new-voices",
])
export const catalogPageSchema = z.number().int().positive()
export const catalogPageSizeSchema = z.number().int().positive().max(50)
export const catalogCursorSchema = z.string().min(1)
export const catalogCursorDirectionSchema = z.enum(["next", "prev"])
export const catalogPaginationSchema = z.object({
  page: catalogPageSchema,
  pageSize: catalogPageSizeSchema,
  totalItems: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  currentCursor: z.string().nullable(),
  nextCursor: z.string().nullable(),
  previousCursor: z.string().nullable(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
})

export const publicCatalogQuerySchema = z.object({
  q: z.string().trim().optional(),
  genre: publicCatalogGenreFilterSchema,
  workType: publicCatalogWorkTypeFilterSchema,
  status: publicCatalogStatusFilterSchema,
  collection: publicCatalogCollectionFilterSchema.optional(),
  sort: publicCatalogSortBySchema,
  scope: publicCatalogScopeSchema,
  page: catalogPageSchema.optional(),
  pageSize: catalogPageSizeSchema.optional(),
  cursor: catalogCursorSchema.optional(),
  direction: catalogCursorDirectionSchema.optional(),
})

export const publicCatalogFacetBucketSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const publicCatalogFacetCountsSchema = z.object({
  total: z.number().int().nonnegative(),
  genres: z.array(publicCatalogFacetBucketSchema),
  workTypes: z.array(publicCatalogFacetBucketSchema),
  statuses: z.array(publicCatalogFacetBucketSchema),
})

export const libraryCatalogFacetItemSchema = z.object({
  value: z.string(),
  label: z.string(),
  count: z.number().int().nonnegative(),
})

export const libraryCatalogFiltersSchema = z.object({
  query: z.string(),
  sortBy: catalogSortBySchema,
  genre: z.string().nullable(),
  workType: novelWorkTypeSchema.nullable(),
  status: novelStatusSchema.nullable(),
  collection: publicCatalogCollectionFilterSchema.nullable(),
  page: catalogPageSchema,
  pageSize: catalogPageSizeSchema,
  cursor: catalogCursorSchema.nullable(),
  direction: catalogCursorDirectionSchema.nullable(),
})

export const libraryCatalogNovelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  workType: novelWorkTypeSchema,
  status: novelStatusSchema,
  visibility: novelVisibilitySchema,
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
  author: z.object({
    id: z.string(),
    npub: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  chaptersCount: z.number().int().nonnegative(),
  readsCount: z.number().int().nonnegative(),
  bookmarksCount: z.number().int().nonnegative(),
  rating: z.number(),
  ratingsCount: z.number().int().nonnegative(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
})

export const libraryCatalogResponseSchema = z.object({
  query: z.string(),
  total: z.number().int().nonnegative(),
  filters: libraryCatalogFiltersSchema,
  pagination: catalogPaginationSchema,
  facets: z.object({
    genres: z.array(libraryCatalogFacetItemSchema),
    workTypes: z.array(libraryCatalogFacetItemSchema),
    statuses: z.array(libraryCatalogFacetItemSchema),
  }),
  novels: z.array(libraryCatalogNovelSchema),
  activeFilters: publicCatalogQuerySchema.optional(),
  publicFacets: publicCatalogFacetCountsSchema.optional(),
})

export const publicNovelAuthorSchema = z.object({
  id: z.string(),
  npub: z.string(),
  displayName: z.string(),
  handle: z.string().nullable(),
  about: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bannerUrl: z.string().nullable(),
  website: z.string().nullable(),
  lud16: z.string().nullable(),
  followersCount: z.number().int().nonnegative(),
  publishedNovelsCount: z.number().int().nonnegative(),
})

export const publicNovelChapterSchema = z.object({
  id: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  previewText: z.string(),
  wordCount: z.number().int().nonnegative(),
  publishedAt: z.string().nullable(),
  priceSats: z.number().int().positive().nullable(),
  isPaid: z.boolean(),
})

export const publicNovelViewerStateSchema = z.object({
  isBookmarked: z.boolean(),
  currentChapterNumber: z.number().int().positive().nullable(),
})

export const publicNovelChapterListSchema = z.object({
  totalChapters: z.number().int().nonnegative(),
  maxChapterNumber: z.number().int().nonnegative(),
  currentPage: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  visibleFrom: z.number().int().nonnegative(),
  visibleTo: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
})

export const publicNovelDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  workType: novelWorkTypeSchema,
  subgenres: z.array(z.string()),
  tags: z.array(z.string()),
  authorDisplayName: z.string(),
  translatorName: z.string(),
  status: novelStatusSchema,
  visibility: novelVisibilitySchema,
  contentWarning: z.string(),
  updateNote: z.string(),
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
  chaptersCount: z.number().int().nonnegative(),
  readsCount: z.number().int().nonnegative(),
  bookmarksCount: z.number().int().nonnegative(),
  rating: z.number(),
  ratingsCount: z.number().int().nonnegative(),
  totalWords: z.number().int().nonnegative(),
  estimatedReadMinutes: z.number().int().positive(),
  publishedAt: z.string().nullable(),
  updatedAt: z.string(),
})

export const publicNovelDetailResponseSchema = z.object({
  novel: publicNovelDetailSchema,
  author: publicNovelAuthorSchema,
  chapterList: publicNovelChapterListSchema,
  chapters: z.array(publicNovelChapterSchema),
  viewer: publicNovelViewerStateSchema,
})

export const publicNovelReaderChapterSchema = publicNovelChapterSchema.extend({
  contentHtml: z.string(),
  previousChapterNumber: z.number().int().positive().nullable(),
  nextChapterNumber: z.number().int().positive().nullable(),
})

export const publicNovelReaderResponseSchema = z.object({
  novel: publicNovelDetailSchema,
  author: publicNovelAuthorSchema,
  chapter: publicNovelReaderChapterSchema,
  chapterList: publicNovelChapterListSchema,
  chapters: z.array(publicNovelChapterSchema),
  viewer: publicNovelViewerStateSchema,
})

export type LibraryCatalogNovelDto = z.infer<typeof libraryCatalogNovelSchema>
export type CatalogSortBy = z.infer<typeof catalogSortBySchema>
export type PublicCatalogScope = z.infer<typeof publicCatalogScopeSchema>
export type PublicCatalogSortBy = z.infer<typeof publicCatalogSortBySchema>
export type CatalogPagination = z.infer<typeof catalogPaginationSchema>
export type PublicCatalogQuery = z.infer<typeof publicCatalogQuerySchema>
export type PublicCatalogFacetBucket = z.infer<typeof publicCatalogFacetBucketSchema>
export type PublicCatalogFacetCounts = z.infer<typeof publicCatalogFacetCountsSchema>
export type LibraryCatalogFacetItemDto = z.infer<typeof libraryCatalogFacetItemSchema>
export type LibraryCatalogFiltersDto = z.infer<typeof libraryCatalogFiltersSchema>
export type LibraryCatalogResponse = z.infer<typeof libraryCatalogResponseSchema>
export type PublicNovelAuthorDto = z.infer<typeof publicNovelAuthorSchema>
export type PublicNovelChapterDto = z.infer<typeof publicNovelChapterSchema>
export type PublicNovelChapterListDto = z.infer<typeof publicNovelChapterListSchema>
export type PublicNovelViewerStateDto = z.infer<typeof publicNovelViewerStateSchema>
export type PublicNovelDetailDto = z.infer<typeof publicNovelDetailSchema>
export type PublicNovelDetailResponse = z.infer<typeof publicNovelDetailResponseSchema>
export type PublicNovelReaderChapterDto = z.infer<typeof publicNovelReaderChapterSchema>
export type PublicNovelReaderResponse = z.infer<typeof publicNovelReaderResponseSchema>
