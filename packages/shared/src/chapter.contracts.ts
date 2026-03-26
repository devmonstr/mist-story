import { z } from "zod"
import { publicNovelChapterListSchema } from "./catalog.contracts"

export const chapterStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"])
export const chapterPublishStateSchema = z.enum(["PENDING", "PUBLISHED", "FAILED"])

export const chapterSchema = z.object({
  id: z.string(),
  novelId: z.string(),
  number: z.number(),
  title: z.string(),
  note: z.string(),
  contentDraft: z.string().nullable(),
  status: chapterStatusSchema,
  publishedAt: z.string().nullable(),
  latestVersionId: z.string().nullable(),
  latestPublishedVersionId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const chapterVersionSchema = z.object({
  id: z.string(),
  chapterId: z.string(),
  version: z.number(),
  previewText: z.string(),
  contentHash: z.string(),
  publishState: chapterPublishStateSchema,
  publishedEventId: z.string().nullable(),
  publishedRelayCount: z.number(),
  lastPublishError: z.string().nullable(),
  publishRequestedAt: z.string(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createChapterInputSchema = z.object({
  title: z.string().min(1).max(200),
  note: z.string().default(""),
  contentDraft: z.string().default(""),
})

export const updateChapterInputSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  note: z.string().optional(),
  contentDraft: z.string().optional(),
  status: chapterStatusSchema.optional(),
})

export const publishChapterInputSchema = z.object({
  previewText: z.string().default(""),
})

export const reorderChaptersInputSchema = z.object({
  chapterPage: z.number().int().positive(),
  orderedChapterIds: z.array(z.string()).min(1),
})

export const studioChapterListResponseSchema = z.object({
  chapters: z.array(chapterSchema),
  chapterList: publicNovelChapterListSchema,
})

export type ChapterDto = z.infer<typeof chapterSchema>
export type ChapterVersionDto = z.infer<typeof chapterVersionSchema>
export type CreateChapterInput = z.infer<typeof createChapterInputSchema>
export type UpdateChapterInput = z.infer<typeof updateChapterInputSchema>
export type PublishChapterInput = z.infer<typeof publishChapterInputSchema>
export type ReorderChaptersInput = z.infer<typeof reorderChaptersInputSchema>
export type StudioChapterListResponse = z.infer<typeof studioChapterListResponseSchema>
