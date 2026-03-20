import { prisma } from "../client"

function buildSearchNovelFilter(query: string) {
  return {
    visibility: "PUBLISHED" as const,
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { summary: { contains: query, mode: "insensitive" as const } },
      { genre: { contains: query, mode: "insensitive" as const } },
      { tags: { has: query } },
      { subgenres: { has: query } },
      { authorDisplayName: { contains: query, mode: "insensitive" as const } },
      {
        author: {
          displayName: { contains: query, mode: "insensitive" as const },
        },
      },
      {
        author: {
          handle: { contains: query, mode: "insensitive" as const },
        },
      },
    ],
  }
}

function buildSearchAuthorFilter(query: string) {
  return {
    OR: [
      { displayName: { contains: query, mode: "insensitive" as const } },
      { handle: { contains: query, mode: "insensitive" as const } },
      { about: { contains: query, mode: "insensitive" as const } },
      { nip05: { contains: query, mode: "insensitive" as const } },
    ],
  }
}

export async function listDiscoverGenres() {
  return prisma.novel.groupBy({
    by: ["genre"],
    where: {
      visibility: "PUBLISHED",
    },
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        genre: "desc",
      },
    },
    take: 6,
  })
}

export async function listDiscoverCollectionNovels(limit = 60) {
  return prisma.novel.findMany({
    where: {
      visibility: "PUBLISHED",
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          pubkey: true,
        },
      },
      _count: {
        select: {
          readingProgress: true,
          bookmarks: true,
        },
      },
    },
  })
}

export async function searchPublishedNovels(query: string) {
  return prisma.novel.findMany({
    where: buildSearchNovelFilter(query),
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      author: {
        select: {
          id: true,
          pubkey: true,
          displayName: true,
          handle: true,
        },
      },
      _count: {
        select: {
          readingProgress: true,
        },
      },
    },
    take: 24,
  })
}

export async function searchAuthors(query: string) {
  return prisma.user.findMany({
    where: buildSearchAuthorFilter(query),
    select: {
      id: true,
      pubkey: true,
      displayName: true,
      handle: true,
      about: true,
      avatarUrl: true,
    },
    take: 18,
  })
}
