import { z } from "zod"

export const myLibrarySavedNovelSchema = z.object({
  novelId: z.string(),
  slug: z.string(),
  title: z.string(),
  authorDisplayName: z.string(),
  genre: z.string(),
  summary: z.string(),
  coverUrl: z.string(),
  savedAt: z.string(),
  progressPercent: z.number(),
  currentChapterNumber: z.number().nullable(),
})

export const myLibraryContinueReadingSchema = z.object({
  novelId: z.string(),
  slug: z.string(),
  title: z.string(),
  authorDisplayName: z.string(),
  currentChapterNumber: z.number(),
  currentChapterTitle: z.string().nullable(),
  totalChapters: z.number(),
  progressPercent: z.number(),
  updatedAt: z.string(),
})

export const myLibraryResponseSchema = z.object({
  savedNovels: z.array(myLibrarySavedNovelSchema),
  continueReading: z.array(myLibraryContinueReadingSchema),
})

export const bookmarkStateSchema = z.object({
  novelId: z.string(),
  isBookmarked: z.boolean(),
  savedAt: z.string().nullable(),
})

export const readingProgressStateSchema = z.object({
  novelId: z.string(),
  chapterId: z.string().nullable(),
  chapterNumber: z.number().nullable(),
  updatedAt: z.string().nullable(),
})

export const upsertReadingProgressInputSchema = z.object({
  novelId: z.string(),
  chapterId: z.string().nullable().optional(),
  chapterNumber: z.number().int().min(1),
})

export type MyLibrarySavedNovelDto = z.infer<typeof myLibrarySavedNovelSchema>
export type MyLibraryContinueReadingDto = z.infer<typeof myLibraryContinueReadingSchema>
export type MyLibraryResponse = z.infer<typeof myLibraryResponseSchema>
export type BookmarkState = z.infer<typeof bookmarkStateSchema>
export type ReadingProgressState = z.infer<typeof readingProgressStateSchema>
export type UpsertReadingProgressInput = z.infer<typeof upsertReadingProgressInputSchema>
