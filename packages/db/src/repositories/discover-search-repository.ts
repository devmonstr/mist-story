import { Prisma } from "@prisma/client"
import { prisma } from "../client"
import {
  buildPublishedNovelWhere,
  normalizeCatalogPagination,
  type CatalogPaginationInput,
  type PublicCatalogNovelFilters,
} from "./catalog-repository"

function buildNovelSearchDocumentSql() {
  return Prisma.sql`
    mist_novel_search_document(
      n."title",
      n."authorDisplayName",
      n."genre",
      n."tags",
      n."subgenres",
      n."summary"
    )
  `
}

function buildAuthorSearchDocumentSql() {
  return Prisma.sql`
    mist_user_search_document(
      u."displayName",
      u."handle",
      u."nip05",
      u."about"
    )
  `
}

function buildNovelSearchWhereSql(filters: PublicCatalogNovelFilters, query: string) {
  const clauses: Prisma.Sql[] = [Prisma.sql`n."visibility" = 'PUBLISHED'`]

  if (filters.genre?.trim()) {
    clauses.push(Prisma.sql`lower(n."genre") = lower(${filters.genre.trim()})`)
  }

  if (filters.workType && filters.workType !== "all") {
    clauses.push(Prisma.sql`n."workType" = ${filters.workType}`)
  }

  if (filters.status && filters.status !== "all") {
    clauses.push(Prisma.sql`n."status" = ${filters.status}`)
  }

  const searchDocument = buildNovelSearchDocumentSql()
  clauses.push(Prisma.sql`
    (
      ${searchDocument} @@ websearch_to_tsquery('simple', ${query})
      OR coalesce(n."title", '') % ${query}
      OR coalesce(n."authorDisplayName", '') % ${query}
      OR coalesce(n."summary", '') % ${query}
      OR coalesce(n."genre", '') % ${query}
    )
  `)

  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
}

function buildAuthorSearchWhereSql(query: string) {
  const searchDocument = buildAuthorSearchDocumentSql()

  return Prisma.sql`
    WHERE
      u."isWriter" = true
      AND EXISTS (
        SELECT 1
        FROM "Novel" n
        WHERE n."authorId" = u.id
          AND n."visibility" = 'PUBLISHED'
      )
      AND (
        ${searchDocument} @@ websearch_to_tsquery('simple', ${query})
        OR coalesce(u."displayName", '') % ${query}
        OR coalesce(u."handle", '') % ${query}
        OR coalesce(u."about", '') % ${query}
        OR coalesce(u."nip05", '') % ${query}
      )
  `
}

function buildNovelSearchOrderBySql(sortBy: "relevance" | "popular" | "recent", query: string) {
  if (sortBy === "popular") {
    return Prisma.sql`
      ORDER BY "readsCount" DESC, "bookmarksCount" DESC, n."ratingsCount" DESC, coalesce(n."publishedAt", n."updatedAt") DESC, n.id DESC
    `
  }

  if (sortBy === "recent") {
    return Prisma.sql`
      ORDER BY coalesce(n."publishedAt", n."updatedAt") DESC, n.id DESC
    `
  }

  const searchDocument = buildNovelSearchDocumentSql()

  return Prisma.sql`
    ORDER BY
      ts_rank_cd(${searchDocument}, websearch_to_tsquery('simple', ${query})) DESC,
      GREATEST(
        similarity(coalesce(n."title", ''), ${query}),
        similarity(coalesce(n."authorDisplayName", ''), ${query}),
        similarity(coalesce(n."genre", ''), ${query})
      ) DESC,
      "readsCount" DESC,
      n."ratingsCount" DESC,
      n.id DESC
  `
}

function buildAuthorSearchOrderBySql(sortBy: "relevance" | "popular" | "recent", query: string) {
  if (sortBy === "popular") {
    return Prisma.sql`
      ORDER BY "followersCount" DESC, "novelsCount" DESC, u."updatedAt" DESC, u.id DESC
    `
  }

  if (sortBy === "recent") {
    return Prisma.sql`
      ORDER BY u."updatedAt" DESC, "followersCount" DESC, u.id DESC
    `
  }

  const searchDocument = buildAuthorSearchDocumentSql()

  return Prisma.sql`
    ORDER BY
      ts_rank_cd(${searchDocument}, websearch_to_tsquery('simple', ${query})) DESC,
      GREATEST(
        similarity(coalesce(u."displayName", ''), ${query}),
        similarity(coalesce(u."handle", ''), ${query}),
        similarity(coalesce(u."nip05", ''), ${query})
      ) DESC,
      "followersCount" DESC,
      "novelsCount" DESC,
      u.id DESC
  `
}

export async function listDiscoverGenres(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.groupBy({
    by: ["genre"],
    where: {
      ...buildPublishedNovelWhere(filters),
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

export async function listDiscoverCollectionNovels(filters: PublicCatalogNovelFilters = {}) {
  return prisma.novel.findMany({
    where: buildPublishedNovelWhere(filters),
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
          bookmarks: true,
        },
      },
    },
  })
}

export async function searchPublishedNovelsWithPagination(
  filters: PublicCatalogNovelFilters,
  query: string,
  sortBy: "relevance" | "popular" | "recent",
  paginationInput: CatalogPaginationInput = {}
) {
  const pagination = normalizeCatalogPagination(paginationInput)
  const whereSql = buildNovelSearchWhereSql(filters, query)
  const orderBySql = buildNovelSearchOrderBySql(sortBy, query)

  const [items, countRows] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string
      slug: string
      title: string
      summary: string
      genre: string
      authorName: string
      authorPubkey: string
      chaptersCount: number
      readsCount: number
      bookmarksCount: number
      coverUrl: string
      coverStorageKey: string | null
    }>>(Prisma.sql`
      SELECT
        n.id,
        n.slug,
        n."title",
        n."summary",
        n."genre",
        coalesce(a."displayName", a."handle", 'Unknown author') AS "authorName",
        a."pubkey" AS "authorPubkey",
        n."chaptersCount",
        COALESCE(reads."readsCount", 0)::int AS "readsCount",
        COALESCE(bookmarks."bookmarksCount", 0)::int AS "bookmarksCount",
        n."coverUrl",
        n."coverStorageKey"
      FROM "Novel" n
      JOIN "User" a ON a.id = n."authorId"
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "readsCount"
        FROM "ReadingProgress" rp
        WHERE rp."novelId" = n.id
      ) reads ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "bookmarksCount"
        FROM "NovelBookmark" nb
        WHERE nb."novelId" = n.id
      ) bookmarks ON true
      ${whereSql}
      ${orderBySql}
      LIMIT ${pagination.take}
      OFFSET ${pagination.skip}
    `),
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "Novel" n
      ${whereSql}
    `),
  ])

  return {
    items,
    total: countRows[0]?.total ?? 0,
    pagination,
  }
}

export async function searchAuthorsWithPagination(
  query: string,
  sortBy: "relevance" | "popular" | "recent",
  paginationInput: CatalogPaginationInput = {}
) {
  const pagination = normalizeCatalogPagination(paginationInput)
  const whereSql = buildAuthorSearchWhereSql(query)
  const orderBySql = buildAuthorSearchOrderBySql(sortBy, query)

  const [items, countRows] = await Promise.all([
    prisma.$queryRaw<Array<{
      id: string
      pubkey: string
      name: string
      bio: string
      avatarUrl: string | null
      followersCount: number
      novelsCount: number
    }>>(Prisma.sql`
      SELECT
        u.id,
        u."pubkey",
        coalesce(u."displayName", u."handle", 'Unknown author') AS name,
        coalesce(u."about", '') AS bio,
        u."avatarUrl",
        COALESCE(followers."followersCount", 0)::int AS "followersCount",
        COALESCE(novels."novelsCount", 0)::int AS "novelsCount"
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "followersCount"
        FROM "UserFollow" uf
        WHERE uf."followingId" = u.id
      ) followers ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "novelsCount"
        FROM "Novel" n
        WHERE n."authorId" = u.id
          AND n."visibility" = 'PUBLISHED'
      ) novels ON true
      ${whereSql}
      ${orderBySql}
      LIMIT ${pagination.take}
      OFFSET ${pagination.skip}
    `),
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "User" u
      ${whereSql}
    `),
  ])

  return {
    items,
    total: countRows[0]?.total ?? 0,
    pagination,
  }
}
