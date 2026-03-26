import { Prisma } from "@prisma/client"
import { prisma } from "../client"
import {
  buildPublishedNovelWhere,
  normalizeCatalogPagination,
  DEFAULT_LIBRARY_PAGE_SIZE,
  MAX_CATALOG_PAGE_SIZE,
  type CatalogPaginationInput,
  type PublicCatalogNovelFilters,
} from "./catalog-repository"

type SearchQueryOptions = {
  includeTotal?: boolean
}

export type SearchNovelKeysetCursor = {
  sortBy: "relevance" | "popular" | "recent"
  id: string
  readsCount: number
  bookmarksCount: number
  ratingsCount: number
  orderDate: string
  rankScore?: number
  similarityScore?: number
}

export type SearchAuthorKeysetCursor = {
  sortBy: "relevance" | "popular" | "recent"
  id: string
  followersCount: number
  novelsCount: number
  updatedAt: string
  rankScore?: number
  similarityScore?: number
}

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

function buildPublishedNovelFilterClauses(
  filters: PublicCatalogNovelFilters,
  alias: Prisma.Sql = Prisma.sql`n`
) {
  const clauses: Prisma.Sql[] = [Prisma.sql`${alias}."visibility" = 'PUBLISHED'`]

  if (filters.genre?.trim()) {
    clauses.push(Prisma.sql`lower(${alias}."genre") = lower(${filters.genre.trim()})`)
  }

  if (filters.workType && filters.workType !== "all") {
    clauses.push(Prisma.sql`${alias}."workType"::text = ${filters.workType}`)
  }

  if (filters.status && filters.status !== "all") {
    clauses.push(Prisma.sql`${alias}."status"::text = ${filters.status}`)
  }

  return clauses
}

function buildNovelSearchCandidatesCte(filters: PublicCatalogNovelFilters, query: string) {
  const baseClauses = buildPublishedNovelFilterClauses(filters)
  const baseWhereSql = Prisma.sql`WHERE ${Prisma.join(baseClauses, " AND ")}`
  const searchDocument = buildNovelSearchDocumentSql()

  return Prisma.sql`
    WITH novel_search_candidates AS (
      SELECT DISTINCT candidate.id
      FROM (
        SELECT id
        FROM (
          SELECT
            n.id,
            ts_rank_cd(${searchDocument}, websearch_to_tsquery('simple', ${query})) AS rank_score,
            coalesce(n."publishedAt", n."updatedAt") AS order_date
          FROM "Novel" n
          ${baseWhereSql}
            AND ${searchDocument} @@ websearch_to_tsquery('simple', ${query})
          ORDER BY rank_score DESC, order_date DESC, n.id DESC
          LIMIT 400
        ) fts_candidates
        UNION ALL
        SELECT id
        FROM (
          SELECT
            n.id,
            similarity(coalesce(n."title", ''), ${query}) AS similarity_score,
            coalesce(n."publishedAt", n."updatedAt") AS order_date
          FROM "Novel" n
          ${baseWhereSql}
            AND coalesce(n."title", '') % ${query}
          ORDER BY similarity_score DESC, order_date DESC, n.id DESC
          LIMIT 200
        ) title_candidates
        UNION ALL
        SELECT id
        FROM (
          SELECT
            n.id,
            similarity(coalesce(n."authorDisplayName", ''), ${query}) AS similarity_score,
            coalesce(n."publishedAt", n."updatedAt") AS order_date
          FROM "Novel" n
          ${baseWhereSql}
            AND coalesce(n."authorDisplayName", '') % ${query}
          ORDER BY similarity_score DESC, order_date DESC, n.id DESC
          LIMIT 120
        ) author_candidates
      ) candidate
    ),
    reading_counts AS (
      SELECT rp."novelId", COUNT(*)::int AS "readsCount"
      FROM "ReadingProgress" rp
      GROUP BY rp."novelId"
    ),
    bookmark_counts AS (
      SELECT nb."novelId", COUNT(*)::int AS "bookmarksCount"
      FROM "NovelBookmark" nb
      GROUP BY nb."novelId"
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
    clauses.push(Prisma.sql`n."workType"::text = ${filters.workType}`)
  }

  if (filters.status && filters.status !== "all") {
    clauses.push(Prisma.sql`n."status"::text = ${filters.status}`)
  }

  const searchDocument = buildNovelSearchDocumentSql()
  clauses.push(Prisma.sql`
    (
      ${searchDocument} @@ websearch_to_tsquery('simple', ${query})
      OR coalesce(n."title", '') % ${query}
      OR coalesce(n."authorDisplayName", '') % ${query}
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
        similarity(coalesce(n."authorDisplayName", ''), ${query})
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

function buildSearchNovelCursorWhereSql(
  sortBy: "relevance" | "popular" | "recent",
  query: string,
  cursor: SearchNovelKeysetCursor | null | undefined,
  direction: "next" | "prev" | null | undefined
) {
  if (!cursor) {
    return Prisma.empty
  }

  const orderDate = new Date(cursor.orderDate)
  if (Number.isNaN(orderDate.getTime())) {
    return Prisma.empty
  }

  const isBackward = direction === "prev"

  if (sortBy === "popular") {
    return isBackward
      ? Prisma.sql`
          AND (
            "readsCount" > ${cursor.readsCount}
            OR ("readsCount" = ${cursor.readsCount} AND "bookmarksCount" > ${cursor.bookmarksCount})
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" > ${cursor.ratingsCount}
            )
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" = ${cursor.ratingsCount}
              AND coalesce(n."publishedAt", n."updatedAt") > ${orderDate}
            )
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" = ${cursor.ratingsCount}
              AND coalesce(n."publishedAt", n."updatedAt") = ${orderDate}
              AND n.id > ${cursor.id}
            )
          )
        `
      : Prisma.sql`
          AND (
            "readsCount" < ${cursor.readsCount}
            OR ("readsCount" = ${cursor.readsCount} AND "bookmarksCount" < ${cursor.bookmarksCount})
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" < ${cursor.ratingsCount}
            )
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" = ${cursor.ratingsCount}
              AND coalesce(n."publishedAt", n."updatedAt") < ${orderDate}
            )
            OR (
              "readsCount" = ${cursor.readsCount}
              AND "bookmarksCount" = ${cursor.bookmarksCount}
              AND n."ratingsCount" = ${cursor.ratingsCount}
              AND coalesce(n."publishedAt", n."updatedAt") = ${orderDate}
              AND n.id < ${cursor.id}
            )
          )
        `
  }

  if (sortBy === "recent") {
    return isBackward
      ? Prisma.sql`
          AND (
            coalesce(n."publishedAt", n."updatedAt") > ${orderDate}
            OR (
              coalesce(n."publishedAt", n."updatedAt") = ${orderDate}
              AND n.id > ${cursor.id}
            )
          )
        `
      : Prisma.sql`
          AND (
            coalesce(n."publishedAt", n."updatedAt") < ${orderDate}
            OR (
              coalesce(n."publishedAt", n."updatedAt") = ${orderDate}
              AND n.id < ${cursor.id}
            )
          )
        `
  }

  const rankScore = cursor.rankScore ?? 0
  const similarityScore = cursor.similarityScore ?? 0
  const rankExpr = Prisma.sql`
    ts_rank_cd(${buildNovelSearchDocumentSql()}, websearch_to_tsquery('simple', ${query}))
  `
  const similarityExpr = Prisma.sql`
    GREATEST(
      similarity(coalesce(n."title", ''), ${query}),
      similarity(coalesce(n."authorDisplayName", ''), ${query}),
      similarity(coalesce(n."genre", ''), ${query})
    )
  `

  return isBackward
    ? Prisma.sql`
        AND (
          ${rankExpr} > ${rankScore}
          OR (${rankExpr} = ${rankScore} AND ${similarityExpr} > ${similarityScore})
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" > ${cursor.readsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" = ${cursor.readsCount}
            AND n."ratingsCount" > ${cursor.ratingsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" = ${cursor.readsCount}
            AND n."ratingsCount" = ${cursor.ratingsCount}
            AND n.id > ${cursor.id}
          )
        )
      `
    : Prisma.sql`
        AND (
          ${rankExpr} < ${rankScore}
          OR (${rankExpr} = ${rankScore} AND ${similarityExpr} < ${similarityScore})
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" < ${cursor.readsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" = ${cursor.readsCount}
            AND n."ratingsCount" < ${cursor.ratingsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "readsCount" = ${cursor.readsCount}
            AND n."ratingsCount" = ${cursor.ratingsCount}
            AND n.id < ${cursor.id}
          )
        )
      `
}

function buildSearchNovelCursorOrderBySql(
  sortBy: "relevance" | "popular" | "recent",
  direction: "next" | "prev" | null | undefined
) {
  const isBackward = direction === "prev"

  if (sortBy === "popular") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            "readsCount" ASC,
            "bookmarksCount" ASC,
            n."ratingsCount" ASC,
            coalesce(n."publishedAt", n."updatedAt") ASC,
            n.id ASC
        `
      : Prisma.sql`
          ORDER BY
            "readsCount" DESC,
            "bookmarksCount" DESC,
            n."ratingsCount" DESC,
            coalesce(n."publishedAt", n."updatedAt") DESC,
            n.id DESC
        `
  }

  if (sortBy === "recent") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            coalesce(n."publishedAt", n."updatedAt") ASC,
            n.id ASC
        `
      : Prisma.sql`
          ORDER BY
            coalesce(n."publishedAt", n."updatedAt") DESC,
            n.id DESC
        `
  }

  return isBackward
    ? Prisma.sql`
        ORDER BY
          "rankScore" ASC,
          "similarityScore" ASC,
          "readsCount" ASC,
          n."ratingsCount" ASC,
          n.id ASC
      `
    : Prisma.sql`
        ORDER BY
          "rankScore" DESC,
          "similarityScore" DESC,
          "readsCount" DESC,
          n."ratingsCount" DESC,
          n.id DESC
      `
}

function buildSearchAuthorCursorWhereSql(
  sortBy: "relevance" | "popular" | "recent",
  query: string,
  cursor: SearchAuthorKeysetCursor | null | undefined,
  direction: "next" | "prev" | null | undefined
) {
  if (!cursor) {
    return Prisma.empty
  }

  const updatedAt = new Date(cursor.updatedAt)
  if (Number.isNaN(updatedAt.getTime())) {
    return Prisma.empty
  }

  const isBackward = direction === "prev"

  if (sortBy === "popular") {
    return isBackward
      ? Prisma.sql`
          AND (
            "followersCount" > ${cursor.followersCount}
            OR ("followersCount" = ${cursor.followersCount} AND "novelsCount" > ${cursor.novelsCount})
            OR (
              "followersCount" = ${cursor.followersCount}
              AND "novelsCount" = ${cursor.novelsCount}
              AND u.id > ${cursor.id}
            )
          )
        `
      : Prisma.sql`
          AND (
            "followersCount" < ${cursor.followersCount}
            OR ("followersCount" = ${cursor.followersCount} AND "novelsCount" < ${cursor.novelsCount})
            OR (
              "followersCount" = ${cursor.followersCount}
              AND "novelsCount" = ${cursor.novelsCount}
              AND u.id < ${cursor.id}
            )
          )
        `
  }

  if (sortBy === "recent") {
    return isBackward
      ? Prisma.sql`
          AND (
            u."updatedAt" > ${updatedAt}
            OR (u."updatedAt" = ${updatedAt} AND "followersCount" > ${cursor.followersCount})
            OR (
              u."updatedAt" = ${updatedAt}
              AND "followersCount" = ${cursor.followersCount}
              AND u.id > ${cursor.id}
            )
          )
        `
      : Prisma.sql`
          AND (
            u."updatedAt" < ${updatedAt}
            OR (u."updatedAt" = ${updatedAt} AND "followersCount" < ${cursor.followersCount})
            OR (
              u."updatedAt" = ${updatedAt}
              AND "followersCount" = ${cursor.followersCount}
              AND u.id < ${cursor.id}
            )
          )
        `
  }

  const rankScore = cursor.rankScore ?? 0
  const similarityScore = cursor.similarityScore ?? 0
  const rankExpr = Prisma.sql`
    ts_rank_cd(${buildAuthorSearchDocumentSql()}, websearch_to_tsquery('simple', ${query}))
  `
  const similarityExpr = Prisma.sql`
    GREATEST(
      similarity(coalesce(u."displayName", ''), ${query}),
      similarity(coalesce(u."handle", ''), ${query}),
      similarity(coalesce(u."nip05", ''), ${query})
    )
  `

  return isBackward
    ? Prisma.sql`
        AND (
          ${rankExpr} > ${rankScore}
          OR (${rankExpr} = ${rankScore} AND ${similarityExpr} > ${similarityScore})
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" > ${cursor.followersCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" = ${cursor.followersCount}
            AND "novelsCount" > ${cursor.novelsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" = ${cursor.followersCount}
            AND "novelsCount" = ${cursor.novelsCount}
            AND u.id > ${cursor.id}
          )
        )
      `
    : Prisma.sql`
        AND (
          ${rankExpr} < ${rankScore}
          OR (${rankExpr} = ${rankScore} AND ${similarityExpr} < ${similarityScore})
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" < ${cursor.followersCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" = ${cursor.followersCount}
            AND "novelsCount" < ${cursor.novelsCount}
          )
          OR (
            ${rankExpr} = ${rankScore}
            AND ${similarityExpr} = ${similarityScore}
            AND "followersCount" = ${cursor.followersCount}
            AND "novelsCount" = ${cursor.novelsCount}
            AND u.id < ${cursor.id}
          )
        )
      `
}

function buildSearchAuthorCursorOrderBySql(
  sortBy: "relevance" | "popular" | "recent",
  direction: "next" | "prev" | null | undefined
) {
  const isBackward = direction === "prev"

  if (sortBy === "popular") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            "followersCount" ASC,
            "novelsCount" ASC,
            u.id ASC
        `
      : Prisma.sql`
          ORDER BY
            "followersCount" DESC,
            "novelsCount" DESC,
            u.id DESC
        `
  }

  if (sortBy === "recent") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            u."updatedAt" ASC,
            "followersCount" ASC,
            u.id ASC
        `
      : Prisma.sql`
          ORDER BY
            u."updatedAt" DESC,
            "followersCount" DESC,
            u.id DESC
        `
  }

  return isBackward
    ? Prisma.sql`
        ORDER BY
          "rankScore" ASC,
          "similarityScore" ASC,
          "followersCount" ASC,
          "novelsCount" ASC,
          u.id ASC
      `
    : Prisma.sql`
        ORDER BY
          "rankScore" DESC,
          "similarityScore" DESC,
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
  paginationInput: CatalogPaginationInput = {},
  options: SearchQueryOptions = {}
) {
  const pagination = normalizeCatalogPagination(paginationInput)
  const orderBySql = buildNovelSearchOrderBySql(sortBy, query)
  const includeTotal = options.includeTotal ?? true

  const itemsPromise = prisma.$queryRaw<Array<{
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
    ${buildNovelSearchCandidatesCte(filters, query)}
    SELECT
      n.id,
      n.slug,
      n."title",
      n."summary",
      n."genre",
      coalesce(a."displayName", a."handle", 'Unknown author') AS "authorName",
      a."pubkey" AS "authorPubkey",
      n."chaptersCount",
      COALESCE(reading_counts."readsCount", 0)::int AS "readsCount",
      COALESCE(bookmark_counts."bookmarksCount", 0)::int AS "bookmarksCount",
      n."coverUrl",
      n."coverStorageKey"
    FROM novel_search_candidates candidate
    JOIN "Novel" n ON n.id = candidate.id
    JOIN "User" a ON a.id = n."authorId"
    LEFT JOIN reading_counts ON reading_counts."novelId" = n.id
    LEFT JOIN bookmark_counts ON bookmark_counts."novelId" = n.id
    ${orderBySql}
    LIMIT ${pagination.take + 1}
    OFFSET ${pagination.skip}
  `)

  const countPromise = includeTotal
    ? prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        ${buildNovelSearchCandidatesCte(filters, query)}
        SELECT COUNT(*)::int AS total
        FROM novel_search_candidates
      `)
    : Promise.resolve(null)

  const [items, countRows] = await Promise.all([
    itemsPromise,
    countPromise,
  ])

  const hasMore = items.length > pagination.take
  const slicedItems = hasMore ? items.slice(0, pagination.take) : items

  return {
    items: slicedItems,
    total: countRows?.[0]?.total ?? null,
    hasMore,
    pagination,
  }
}

export async function searchPublishedNovelsWithCursor(
  filters: PublicCatalogNovelFilters,
  query: string,
  sortBy: "relevance" | "popular" | "recent",
  input: {
    pageSize?: number
    cursor?: SearchNovelKeysetCursor | null
    direction?: "next" | "prev" | null
  } = {},
  options: SearchQueryOptions = {}
) {
  const pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
      ? Math.min(MAX_CATALOG_PAGE_SIZE, Math.floor(input.pageSize!))
      : DEFAULT_LIBRARY_PAGE_SIZE
  const cursorWhereSql = buildSearchNovelCursorWhereSql(
    sortBy,
    query,
    input.cursor,
    input.direction
  )
  const orderBySql = buildSearchNovelCursorOrderBySql(sortBy, input.direction)
  const includeTotal = options.includeTotal ?? true

  const itemsPromise = prisma.$queryRaw<Array<{
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
      ratingsCount: number
      publishedAt: Date | null
      updatedAt: Date
      rankScore: number
      similarityScore: number
    }>>(Prisma.sql`
      ${buildNovelSearchCandidatesCte(filters, query)}
      SELECT
        n.id,
        n.slug,
        n."title",
        n."summary",
        n."genre",
        coalesce(a."displayName", a."handle", 'Unknown author') AS "authorName",
        a."pubkey" AS "authorPubkey",
        n."chaptersCount",
        COALESCE(reading_counts."readsCount", 0)::int AS "readsCount",
        COALESCE(bookmark_counts."bookmarksCount", 0)::int AS "bookmarksCount",
        n."coverUrl",
        n."coverStorageKey",
        n."ratingsCount",
        n."publishedAt",
        n."updatedAt",
        ts_rank_cd(${buildNovelSearchDocumentSql()}, websearch_to_tsquery('simple', ${query}))::double precision AS "rankScore",
        GREATEST(
          similarity(coalesce(n."title", ''), ${query}),
          similarity(coalesce(n."authorDisplayName", ''), ${query})
        )::double precision AS "similarityScore"
      FROM novel_search_candidates candidate
      JOIN "Novel" n ON n.id = candidate.id
      JOIN "User" a ON a.id = n."authorId"
      LEFT JOIN reading_counts ON reading_counts."novelId" = n.id
      LEFT JOIN bookmark_counts ON bookmark_counts."novelId" = n.id
      WHERE 1 = 1
      ${cursorWhereSql}
      ${orderBySql}
      LIMIT ${pageSize + 1}
    `)

  const countPromise = includeTotal
    ? prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        ${buildNovelSearchCandidatesCte(filters, query)}
        SELECT COUNT(*)::int AS total
        FROM novel_search_candidates
      `)
    : Promise.resolve(null)

  const [items, countRows] = await Promise.all([itemsPromise, countPromise])

  const hasMore = items.length > pageSize
  const slicedItems = hasMore ? items.slice(0, pageSize) : items
  const orderedItems = input.direction === "prev" ? [...slicedItems].reverse() : slicedItems

  return {
    items: orderedItems,
    total: countRows?.[0]?.total ?? null,
    hasMore,
    pageSize,
  }
}

export async function searchAuthorsWithPagination(
  query: string,
  sortBy: "relevance" | "popular" | "recent",
  paginationInput: CatalogPaginationInput = {},
  options: SearchQueryOptions = {}
) {
  const pagination = normalizeCatalogPagination(paginationInput)
  const whereSql = buildAuthorSearchWhereSql(query)
  const orderBySql = buildAuthorSearchOrderBySql(sortBy, query)
  const includeTotal = options.includeTotal ?? true

  const itemsPromise = prisma.$queryRaw<Array<{
    id: string
    pubkey: string
    name: string
    bio: string
    avatarUrl: string | null
    followersCount: number
    novelsCount: number
  }>>(Prisma.sql`
    WITH follower_counts AS (
      SELECT uf."followingId" AS "userId", COUNT(*)::int AS "followersCount"
      FROM "UserFollow" uf
      GROUP BY uf."followingId"
    ),
    published_novel_counts AS (
      SELECT n."authorId" AS "userId", COUNT(*)::int AS "novelsCount"
      FROM "Novel" n
      WHERE n."visibility" = 'PUBLISHED'
      GROUP BY n."authorId"
    )
    SELECT
      u.id,
      u."pubkey",
      coalesce(u."displayName", u."handle", 'Unknown author') AS name,
      coalesce(u."about", '') AS bio,
      u."avatarUrl",
      COALESCE(follower_counts."followersCount", 0)::int AS "followersCount",
      COALESCE(published_novel_counts."novelsCount", 0)::int AS "novelsCount"
    FROM "User" u
    LEFT JOIN follower_counts ON follower_counts."userId" = u.id
    LEFT JOIN published_novel_counts ON published_novel_counts."userId" = u.id
    ${whereSql}
    ${orderBySql}
    LIMIT ${pagination.take + 1}
    OFFSET ${pagination.skip}
  `)

  const countPromise = includeTotal
    ? prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM "User" u
        ${whereSql}
      `)
    : Promise.resolve(null)

  const [items, countRows] = await Promise.all([
    itemsPromise,
    countPromise,
  ])

  const hasMore = items.length > pagination.take
  const slicedItems = hasMore ? items.slice(0, pagination.take) : items

  return {
    items: slicedItems,
    total: countRows?.[0]?.total ?? null,
    hasMore,
    pagination,
  }
}

export async function searchAuthorsWithCursor(
  query: string,
  sortBy: "relevance" | "popular" | "recent",
  input: {
    pageSize?: number
    cursor?: SearchAuthorKeysetCursor | null
    direction?: "next" | "prev" | null
  } = {},
  options: SearchQueryOptions = {}
) {
  const pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
      ? Math.min(MAX_CATALOG_PAGE_SIZE, Math.floor(input.pageSize!))
      : DEFAULT_LIBRARY_PAGE_SIZE
  const whereSql = buildAuthorSearchWhereSql(query)
  const cursorWhereSql = buildSearchAuthorCursorWhereSql(
    sortBy,
    query,
    input.cursor,
    input.direction
  )
  const orderBySql = buildSearchAuthorCursorOrderBySql(sortBy, input.direction)
  const includeTotal = options.includeTotal ?? true

  const itemsPromise = prisma.$queryRaw<Array<{
      id: string
      pubkey: string
      name: string
      bio: string
      avatarUrl: string | null
      followersCount: number
      novelsCount: number
      updatedAt: Date
      rankScore: number
      similarityScore: number
    }>>(Prisma.sql`
      WITH follower_counts AS (
        SELECT uf."followingId" AS "userId", COUNT(*)::int AS "followersCount"
        FROM "UserFollow" uf
        GROUP BY uf."followingId"
      ),
      published_novel_counts AS (
        SELECT n."authorId" AS "userId", COUNT(*)::int AS "novelsCount"
        FROM "Novel" n
        WHERE n."visibility" = 'PUBLISHED'
        GROUP BY n."authorId"
      )
      SELECT
        u.id,
        u."pubkey",
        coalesce(u."displayName", u."handle", 'Unknown author') AS name,
        coalesce(u."about", '') AS bio,
        u."avatarUrl",
        u."updatedAt",
        COALESCE(follower_counts."followersCount", 0)::int AS "followersCount",
        COALESCE(published_novel_counts."novelsCount", 0)::int AS "novelsCount",
        ts_rank_cd(${buildAuthorSearchDocumentSql()}, websearch_to_tsquery('simple', ${query}))::double precision AS "rankScore",
        GREATEST(
          similarity(coalesce(u."displayName", ''), ${query}),
          similarity(coalesce(u."handle", ''), ${query}),
          similarity(coalesce(u."nip05", ''), ${query})
        )::double precision AS "similarityScore"
      FROM "User" u
      LEFT JOIN follower_counts ON follower_counts."userId" = u.id
      LEFT JOIN published_novel_counts ON published_novel_counts."userId" = u.id
      ${whereSql}
      ${cursorWhereSql}
      ${orderBySql}
      LIMIT ${pageSize + 1}
    `)

  const countPromise = includeTotal
    ? prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM "User" u
        ${whereSql}
      `)
    : Promise.resolve(null)

  const [items, countRows] = await Promise.all([itemsPromise, countPromise])

  const hasMore = items.length > pageSize
  const slicedItems = hasMore ? items.slice(0, pageSize) : items
  const orderedItems = input.direction === "prev" ? [...slicedItems].reverse() : slicedItems

  return {
    items: orderedItems,
    total: countRows?.[0]?.total ?? null,
    hasMore,
    pageSize,
  }
}
