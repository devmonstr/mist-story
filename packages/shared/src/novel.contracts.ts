import { z } from "zod"

export const novelStatusSchema = z.enum(["Ongoing", "Completed", "Hiatus"])
export const novelVisibilitySchema = z.enum(["PUBLISHED", "HIDDEN"])

export const novelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  genre: z.string(),
  subgenres: z.array(z.string()),
  tags: z.array(z.string()),
  authorId: z.string(),
  authorDisplayName: z.string(),
  translatorName: z.string(),
  status: novelStatusSchema,
  visibility: novelVisibilitySchema,
  rating: z.number(),
  ratingsCount: z.number(),
  updateNote: z.string(),
  coverUrl: z.string(),
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
  subgenres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  authorDisplayName: z.string().default(""),
  translatorName: z.string().default(""),
  status: novelStatusSchema.default("Ongoing"),
  visibility: novelVisibilitySchema.default("HIDDEN"),
  updateNote: z.string().default(""),
  coverUrl: z.string().default(""),
})

export const updateNovelInputSchema = createNovelInputSchema.partial()

export type NovelDto = z.infer<typeof novelSchema>
export type CreateNovelInput = z.infer<typeof createNovelInputSchema>
export type UpdateNovelInput = z.infer<typeof updateNovelInputSchema>
