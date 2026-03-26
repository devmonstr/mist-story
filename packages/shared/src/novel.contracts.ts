import { z } from "zod"

export const novelStatusSchema = z.enum(["Ongoing", "Completed", "Hiatus"])
export const novelVisibilitySchema = z.enum(["PUBLISHED", "HIDDEN"])
export const novelWorkTypeSchema = z.enum(["ORIGINAL", "TRANSLATION"])

export const novelCoverUploadSchema = z.object({
  dataUrl: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(128),
  fileSizeBytes: z.number().int().positive().max(5 * 1024 * 1024),
})

export const novelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  workType: novelWorkTypeSchema,
  subgenres: z.array(z.string()),
  tags: z.array(z.string()),
  authorId: z.string(),
  authorDisplayName: z.string(),
  translatorName: z.string(),
  status: novelStatusSchema,
  isComplete: z.boolean(),
  visibility: novelVisibilitySchema,
  contentWarning: z.string(),
  rating: z.number(),
  ratingsCount: z.number(),
  updateNote: z.string(),
  coverUrl: z.string(),
  coverStorageKey: z.string().nullable(),
  coverMimeType: z.string().nullable(),
  coverOriginalName: z.string().nullable(),
  coverFileSizeBytes: z.number().int().nullable(),
  chaptersCount: z.number(),
  publishedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createNovelInputSchema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).default(""),
  genre: z.string().min(1),
  workType: novelWorkTypeSchema.default("ORIGINAL"),
  subgenres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authorDisplayName: z.string().default(""),
  translatorName: z.string().default(""),
  isComplete: z.boolean().default(false),
  status: novelStatusSchema.default("Ongoing"),
  visibility: novelVisibilitySchema.default("HIDDEN"),
  contentWarning: z.string().max(1000).default(""),
  updateNote: z.string().default(""),
  coverUrl: z.string().default(""),
  clearCover: z.boolean().default(false),
  coverUpload: novelCoverUploadSchema.nullish(),
})

export const updateNovelInputSchema = createNovelInputSchema.partial()

export type NovelDto = z.infer<typeof novelSchema>
export type CreateNovelInput = z.infer<typeof createNovelInputSchema>
export type UpdateNovelInput = z.infer<typeof updateNovelInputSchema>
