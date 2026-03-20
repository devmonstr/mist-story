import { z } from "zod"
import {
  novelStatusSchema,
  novelVisibilitySchema,
  novelWorkTypeSchema,
} from "./novel.contracts"

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
  novels: z.array(libraryCatalogNovelSchema),
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
  chapters: z.array(publicNovelChapterSchema),
  viewer: publicNovelViewerStateSchema,
})

export type LibraryCatalogNovelDto = z.infer<typeof libraryCatalogNovelSchema>
export type LibraryCatalogResponse = z.infer<typeof libraryCatalogResponseSchema>
export type PublicNovelAuthorDto = z.infer<typeof publicNovelAuthorSchema>
export type PublicNovelChapterDto = z.infer<typeof publicNovelChapterSchema>
export type PublicNovelViewerStateDto = z.infer<typeof publicNovelViewerStateSchema>
export type PublicNovelDetailDto = z.infer<typeof publicNovelDetailSchema>
export type PublicNovelDetailResponse = z.infer<typeof publicNovelDetailResponseSchema>
export type PublicNovelReaderChapterDto = z.infer<typeof publicNovelReaderChapterSchema>
export type PublicNovelReaderResponse = z.infer<typeof publicNovelReaderResponseSchema>
