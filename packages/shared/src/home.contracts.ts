import { z } from "zod"
import { discoverGenreSchema } from "./discover.contracts"
import { libraryCatalogNovelSchema } from "./catalog.contracts"

export const homeShelfIdSchema = z.enum([
  "trending",
  "new-releases",
  "hidden-gems",
  "editors-picks",
  "new-voices",
])

export const homeShelfSchema = z.object({
  id: homeShelfIdSchema,
  title: z.string(),
  description: z.string(),
  href: z.string(),
  novels: z.array(libraryCatalogNovelSchema),
})

export const homeResponseSchema = z.object({
  generatedAt: z.string(),
  stats: z.object({
    publishedStories: z.number().int().nonnegative(),
    genresCount: z.number().int().nonnegative(),
    activeWriters: z.number().int().nonnegative(),
  }),
  hero: z.object({
    featuredNovel: libraryCatalogNovelSchema.nullable(),
    href: z.string(),
  }),
  shelves: z.array(homeShelfSchema),
  genres: z.array(discoverGenreSchema),
})

export type HomeShelfId = z.infer<typeof homeShelfIdSchema>
export type HomeShelfDto = z.infer<typeof homeShelfSchema>
export type HomeResponse = z.infer<typeof homeResponseSchema>
