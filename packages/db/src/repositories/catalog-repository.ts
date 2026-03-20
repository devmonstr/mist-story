import type { Prisma } from "@prisma/client"
import { prisma } from "../client"
import type { CatalogSortBy } from "@mist/shared"

export type PublicCatalogNovelFilters = {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | "all" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | "all" | null
}

export type CatalogPaginationInput = {
  page?: number
  pageSize?: number
}

export const DEFAULT_LIBRARY_PAGE_SIZE = 18
export const MAX_CATALOG_PAGE_SIZE = 50

type CatalogFilterOptions = {
  includeQuery?: boolean
  includeGenre?: boolean
  includeWorkType?: boolean
  includeStatus?: boolean
}

export function buildPublishedNovelWhere(
  filters: PublicCatalogNovelFilters = {},
  options: CatalogFilterOptions = {}
) {
  const where: {
    visibility: "PUBLISHED"
    AND?: Array<Record<string, unknown>>
  } = {
    visibility: "PUBLISHED",
  }

  const and: Array<Record<string, unknown>> = []
  const query = filters.query?.trim()

  if (options.includeQuery !== false && query) {
    and.push({
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
    })
  }

  if (options.includeGenre !== false && filters.genre?.trim()) {
    and.push({
      genre: {
        equals: filters.genre.trim(),
        mode: "insensitive" as const,
      },
    })
  }

  if (options.includeWorkType !== false && filters.workType && filters.workType !== "all") {
    and.push({ workType: filters.workType })
  }

  if (options.includeStatus !== false && filters.status && filters.status !== "all") {
    and.push({ status: filters.status })
  }

  if (and.length > 0) {
    where.AND = and
  }

  return where
}

export function normalizeCatalogPagination(input: CatalogPaginationInput = {}) {
  const page = Number.isFinite(input.page) && (input.page ?? 0) > 0 ? Math.floor(input.page!) : 1
  const pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
      ? Math.min(MAX_CATALOG_PAGE_SIZE, Math.floor(input.pageSize!))
      : DEFAULT_LIBRARY_PAGE_SIZE

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

export function buildLibraryCatalogOrderBy(
  sortBy: CatalogSortBy
): Prisma.NovelOrderByWithRelationInput[] {
  if (sortBy === "popular") {
    return [
      { readingProgress: { _count: "desc" } },
      { bookmarks: { _count: "desc" } },
      { ratingsCount: "desc" },
      { publishedAt: "desc" },
      { updatedAt: "desc" },
    ]
  }

  if (sortBy === "rating") {
    return [
      { rating: "desc" },
      { ratingsCount: "desc" },
      { publishedAt: "desc" },
      { updatedAt: "desc" },
    ]
  }

  if (sortBy === "title") {
    return [{ title: "asc" }, { publishedAt: "desc" }, { updatedAt: "desc" }]
  }

  return [{ publishedAt: "desc" }, { updatedAt: "desc" }]
}

function libraryCatalogInclude() {
  return {
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
  } satisfies Prisma.NovelInclude
}

export async function countLibraryCatalogNovels(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.count({
    where: buildPublishedNovelWhere(filters),
  })
}

export async function listLibraryCatalogNovels(
  filters: PublicCatalogNovelFilters = {},
  input: CatalogPaginationInput & { sortBy?: CatalogSortBy } = {}
) {
  const pagination = normalizeCatalogPagination(input)

  return prisma.novel.findMany({
    where: buildPublishedNovelWhere(filters),
    orderBy: buildLibraryCatalogOrderBy(input.sortBy ?? "recent"),
    skip: pagination.skip,
    take: pagination.take,
    include: libraryCatalogInclude(),
  })
}

export async function listAllLibraryCatalogNovels(
  filters: PublicCatalogNovelFilters = {},
  sortBy: CatalogSortBy = "recent"
) {
  return prisma.novel.findMany({
    where: buildPublishedNovelWhere(filters),
    orderBy: buildLibraryCatalogOrderBy(sortBy),
    include: libraryCatalogInclude(),
  })
}

export async function listLibraryCatalogGenreFacets(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.groupBy({
    by: ["genre"],
    where: buildPublishedNovelWhere(filters, {
      includeGenre: false,
    }),
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        genre: "desc",
      },
    },
    take: 12,
  })
}

export async function listLibraryCatalogWorkTypeFacets(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.groupBy({
    by: ["workType"],
    where: buildPublishedNovelWhere(filters, {
      includeWorkType: false,
    }),
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        workType: "desc",
      },
    },
  })
}

export async function listLibraryCatalogStatusFacets(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.groupBy({
    by: ["status"],
    where: buildPublishedNovelWhere(filters, {
      includeStatus: false,
    }),
    _count: {
      _all: true,
    },
    orderBy: {
      _count: {
        status: "desc",
      },
    },
  })
}

export async function listLibraryCatalogFacetCounts(filters: PublicCatalogNovelFilters = {}) {
  const [genres, workTypes, statuses, total] = await Promise.all([
    listLibraryCatalogGenreFacets(filters),
    listLibraryCatalogWorkTypeFacets(filters),
    listLibraryCatalogStatusFacets(filters),
    prisma.novel.count({
      where: buildPublishedNovelWhere(filters),
    }),
  ])

  return {
    total,
    genres,
    workTypes,
    statuses,
  }
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
