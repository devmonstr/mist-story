import { prisma } from "../client"

function buildLibraryQueryFilter(query?: string) {
  const value = query?.trim()
  if (!value) {
    return {}
  }

  return {
    OR: [
      { title: { contains: value, mode: "insensitive" as const } },
      { summary: { contains: value, mode: "insensitive" as const } },
      { genre: { contains: value, mode: "insensitive" as const } },
      { tags: { has: value } },
      { subgenres: { has: value } },
      { authorDisplayName: { contains: value, mode: "insensitive" as const } },
      {
        author: {
          displayName: { contains: value, mode: "insensitive" as const },
        },
      },
      {
        author: {
          handle: { contains: value, mode: "insensitive" as const },
        },
      },
    ],
  }
}

export async function listLibraryCatalogNovels(query?: string) {
  return prisma.novel.findMany({
    where: {
      visibility: "PUBLISHED",
      ...buildLibraryQueryFilter(query),
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      author: {
        select: {
          id: true,
          pubkey: true,
          displayName: true,
          handle: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          bookmarks: true,
          readingProgress: true,
        },
      },
    },
  })
}

export async function findPublicNovelByIdOrSlug(identifier: string) {
  return prisma.novel.findFirst({
    where: {
      visibility: "PUBLISHED",
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: {
      author: {
        select: {
          id: true,
          pubkey: true,
          handle: true,
          displayName: true,
          about: true,
          avatarUrl: true,
          bannerUrl: true,
          website: true,
          lud16: true,
        },
      },
      _count: {
        select: {
          bookmarks: true,
          readingProgress: true,
        },
      },
    },
  })
}

export async function listPublicNovelChapters(novelId: string) {
  return prisma.chapter.findMany({
    where: {
      novelId,
      status: "PUBLISHED",
    },
    orderBy: { number: "asc" },
    include: {
      price: true,
      latestPublishedVersion: {
        select: {
          previewText: true,
          ciphertext: true,
        },
      },
    },
  })
}

export async function findPublicChapterForNovelByNumber(
  novelId: string,
  chapterNumber: number
) {
  return prisma.chapter.findFirst({
    where: {
      novelId,
      number: chapterNumber,
      status: "PUBLISHED",
    },
    include: {
      price: true,
      latestPublishedVersion: {
        select: {
          previewText: true,
          ciphertext: true,
        },
      },
    },
  })
}
