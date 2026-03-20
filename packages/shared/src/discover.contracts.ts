import { z } from "zod"

export const discoverGenreSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  storiesCount: z.number().int().nonnegative(),
  href: z.string(),
})

export const discoverCollectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  storyCount: z.number().int().nonnegative(),
  curator: z.string(),
  href: z.string(),
})

export const discoverResponseSchema = z.object({
  genres: z.array(discoverGenreSchema),
  collections: z.array(discoverCollectionSchema),
})

export type DiscoverGenreDto = z.infer<typeof discoverGenreSchema>
export type DiscoverCollectionDto = z.infer<typeof discoverCollectionSchema>
export type DiscoverResponse = z.infer<typeof discoverResponseSchema>
