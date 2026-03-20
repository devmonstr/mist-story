import {
  countPublishedNovelsForUsers,
  decimalToNumber,
} from "@mist/db"
import type { CatalogSortBy, PublicCatalogSortBy } from "@mist/shared"

type CatalogNovelCounts = {
  _count: {
    readingProgress: number
    bookmarks: number
  }
}

type CatalogNovelBase = CatalogNovelCounts & {
  title: string
  authorId: string
  rating: Parameters<typeof decimalToNumber>[0]
  ratingsCount: number
  publishedAt: Date | null
  updatedAt: Date
}

export async function applyCatalogCollection<T extends CatalogNovelBase>(
  novels: T[],
  collection: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null | undefined
) {
  if (!collection) {
    return novels
  }

  if (collection === "trending") {
    return [...novels].sort(
      (a, b) => b._count.readingProgress - a._count.readingProgress
    )
  }

  if (collection === "hidden-gems") {
    return [...novels]
      .filter((novel) => novel._count.readingProgress <= 25)
      .sort((a, b) => {
        if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
          return decimalToNumber(b.rating) - decimalToNumber(a.rating)
        }

        return b._count.bookmarks - a._count.bookmarks
      })
  }

  if (collection === "editors-picks") {
    return [...novels].sort((a, b) => {
      if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
        return decimalToNumber(b.rating) - decimalToNumber(a.rating)
      }
      if (b.ratingsCount !== a.ratingsCount) {
        return b.ratingsCount - a.ratingsCount
      }

      return b._count.readingProgress - a._count.readingProgress
    })
  }

  const publishedNovelCounts = await countPublishedNovelsForUsers(
    novels.map((novel) => novel.authorId)
  )

  return [...novels]
    .filter((novel) => (publishedNovelCounts.get(novel.authorId) ?? 0) <= 1)
    .sort((a, b) => {
      const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
      const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
      return right - left
    })
}

export function sortCatalogNovels<T extends CatalogNovelBase>(
  novels: T[],
  sortBy: CatalogSortBy | PublicCatalogSortBy
) {
  return [...novels].sort((a, b) => {
    if (sortBy === "relevance") {
      const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
      const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
      return right - left
    }

    if (sortBy === "recent") {
      const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
      const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
      return right - left
    }

    if (sortBy === "rating") {
      if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
        return decimalToNumber(b.rating) - decimalToNumber(a.rating)
      }

      return b.ratingsCount - a.ratingsCount
    }

    if (sortBy === "title") {
      return a.title.localeCompare(b.title)
    }

    if (b._count.readingProgress !== a._count.readingProgress) {
      return b._count.readingProgress - a._count.readingProgress
    }

    if (b._count.bookmarks !== a._count.bookmarks) {
      return b._count.bookmarks - a._count.bookmarks
    }

    return b.ratingsCount - a.ratingsCount
  })
}
