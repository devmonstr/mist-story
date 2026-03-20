import { Prisma } from "@prisma/client"
import { prisma } from "../client"
import type { CatalogSortBy } from "@mist/shared"

export type PublicCatalogNovelFilters = {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | "all" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | "all" | null
}

export type CatalogCollection =
  | "trending"
  | "hidden-gems"
  | "editors-picks"
  | "new-voices"

export type LibraryCatalogKeysetCursor = {
  sortBy: CatalogSortBy
  id: string
  orderDate: string
  readsCount?: number
  bookmarksCount?: number
  ratingsCount?: number
  rating?: number
  title?: string
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

type LibraryCollectionFacetCount = {
  value: string
  label: string
  count: number
}

type LibraryCollectionFacetCounts = {
  total: number
  genres: LibraryCollectionFacetCount[]
  workTypes: LibraryCollectionFacetCount[]
  statuses: LibraryCollectionFacetCount[]
}

function buildPublishedNovelWhereSql(filters: PublicCatalogNovelFilters = {}) {
  const clauses: Prisma.Sql[] = [Prisma.sql`n."visibility" = 'PUBLISHED'`]
  const query = filters.query?.trim()

  if (query) {
    const likeQuery = `%${query}%`
    clauses.push(Prisma.sql`
      (
        n."title" ILIKE ${likeQuery}
        OR coalesce(n."summary", '') ILIKE ${likeQuery}
        OR coalesce(n."genre", '') ILIKE ${likeQuery}
        OR coalesce(n."authorDisplayName", '') ILIKE ${likeQuery}
        OR coalesce(a."displayName", '') ILIKE ${likeQuery}
        OR coalesce(a."handle", '') ILIKE ${likeQuery}
        OR EXISTS (
          SELECT 1
          FROM unnest(n."tags") AS tag(value)
          WHERE value ILIKE ${likeQuery}
        )
        OR EXISTS (
          SELECT 1
          FROM unnest(n."subgenres") AS subgenre(value)
          WHERE value ILIKE ${likeQuery}
        )
      )
    `)
  }

  if (filters.genre?.trim()) {
    clauses.push(Prisma.sql`n."genre" ILIKE ${filters.genre.trim()}`)
  }

  if (filters.workType && filters.workType !== "all") {
    clauses.push(Prisma.sql`n."workType" = ${filters.workType}`)
  }

  if (filters.status && filters.status !== "all") {
    clauses.push(Prisma.sql`n."status" = ${filters.status}`)
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
}

function buildLibraryCollectionBaseCte(filters: PublicCatalogNovelFilters = {}) {
  const whereSql = buildPublishedNovelWhereSql(filters)

  return Prisma.sql`
    WITH catalog_base AS (
      SELECT
        n.id,
        n.slug,
        n."title",
        n."summary",
        n."genre",
        n."workType",
        n."status",
        n."visibility",
        n."coverUrl",
        n."coverStorageKey",
        n."chaptersCount",
        n.rating::double precision AS rating,
        n."ratingsCount",
        n."publishedAt",
        n."updatedAt",
        n."authorDisplayName",
        n."authorId",
        a."pubkey" AS "authorPubkey",
        a."displayName" AS "authorName",
        a.handle AS "authorHandle",
        a."avatarUrl" AS "authorAvatarUrl",
        COALESCE(reads."readsCount", 0)::int AS "readsCount",
        COALESCE(bookmarks."bookmarksCount", 0)::int AS "bookmarksCount",
        COALESCE(author_novels."publishedNovelsCount", 0)::int AS "authorPublishedNovelsCount"
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
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS "publishedNovelsCount"
        FROM "Novel" author_novel
        WHERE author_novel."authorId" = n."authorId"
          AND author_novel."visibility" = 'PUBLISHED'
      ) author_novels ON true
      ${whereSql}
    )
  `
}

function buildLibraryCollectionPredicateSql(collection: CatalogCollection) {
  if (collection === "hidden-gems") {
    return Prisma.sql`base."readsCount" <= 25`
  }

  if (collection === "new-voices") {
    return Prisma.sql`base."authorPublishedNovelsCount" <= 1`
  }

  return null
}

function buildLibraryCollectionOrderBySql(collection: CatalogCollection) {
  if (collection === "trending") {
    return Prisma.sql`
      ORDER BY
        base."readsCount" DESC,
        base."bookmarksCount" DESC,
        base."ratingsCount" DESC,
        coalesce(base."publishedAt", base."updatedAt") DESC,
        base.id DESC
    `
  }

  if (collection === "hidden-gems") {
    return Prisma.sql`
      ORDER BY
        base.rating DESC,
        base."bookmarksCount" DESC,
        base."readsCount" DESC,
        coalesce(base."publishedAt", base."updatedAt") DESC,
        base.id DESC
    `
  }

  if (collection === "editors-picks") {
    return Prisma.sql`
      ORDER BY
        base.rating DESC,
        base."ratingsCount" DESC,
        base."readsCount" DESC,
        coalesce(base."publishedAt", base."updatedAt") DESC,
        base.id DESC
    `
  }

  return Prisma.sql`
    ORDER BY
      coalesce(base."publishedAt", base."updatedAt") DESC,
      base.id DESC
  `
}

type LibraryCollectionNovelRow = {
  id: string
  slug: string
  title: string
  summary: string
  genre: string
  workType: "ORIGINAL" | "TRANSLATION"
  status: "Ongoing" | "Completed" | "Hiatus"
  visibility: "PUBLISHED" | "HIDDEN"
  coverUrl: string
  coverStorageKey: string | null
  chaptersCount: number
  rating: number
  ratingsCount: number
  publishedAt: Date | null
  updatedAt: Date
  authorDisplayName: string | null
  author: {
    id: string
    pubkey: string
    displayName: string | null
    handle: string | null
    avatarUrl: string | null
  }
  _count: {
    readingProgress: number
    bookmarks: number
  }
}

function mapLibraryCollectionNovelRow(row: {
  id: string
  slug: string
  title: string
  summary: string
  genre: string
  workType: "ORIGINAL" | "TRANSLATION"
  status: "Ongoing" | "Completed" | "Hiatus"
  visibility: "PUBLISHED" | "HIDDEN"
  coverUrl: string
  coverStorageKey: string | null
  chaptersCount: number
  rating: number
  ratingsCount: number
  publishedAt: Date | null
  updatedAt: Date
  authorDisplayName: string | null
  authorId: string
  authorPubkey: string
  authorName: string | null
  authorHandle: string | null
  authorAvatarUrl: string | null
  readsCount: number
  bookmarksCount: number
}): LibraryCollectionNovelRow {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    genre: row.genre,
    workType: row.workType,
    status: row.status,
    visibility: row.visibility,
    coverUrl: row.coverUrl,
    coverStorageKey: row.coverStorageKey ?? null,
    chaptersCount: row.chaptersCount,
    rating: row.rating,
    ratingsCount: row.ratingsCount,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    authorDisplayName: row.authorDisplayName,
    author: {
      id: row.authorId,
      pubkey: row.authorPubkey,
      displayName: row.authorName,
      handle: row.authorHandle,
      avatarUrl: row.authorAvatarUrl,
    },
    _count: {
      readingProgress: row.readsCount,
      bookmarks: row.bookmarksCount,
    },
  }
}

export async function listLibraryCollectionNovels(
  collection: CatalogCollection,
  filters: PublicCatalogNovelFilters = {},
  input: CatalogPaginationInput = {}
) {
  const pagination = normalizeCatalogPagination(input)
  const baseSql = buildLibraryCollectionBaseCte(filters)
  const collectionPredicateSql = buildLibraryCollectionPredicateSql(collection)
  const collectionWhereSql = collectionPredicateSql
    ? Prisma.sql`WHERE ${collectionPredicateSql}`
    : Prisma.empty
  const orderBySql = buildLibraryCollectionOrderBySql(collection)

  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      title: string
      summary: string
      genre: string
      workType: "ORIGINAL" | "TRANSLATION"
      status: "Ongoing" | "Completed" | "Hiatus"
      visibility: "PUBLISHED" | "HIDDEN"
      coverUrl: string
      coverStorageKey: string | null
      chaptersCount: number
      rating: number
      ratingsCount: number
      publishedAt: Date | null
      updatedAt: Date
      authorDisplayName: string | null
      authorId: string
      authorPubkey: string
      authorName: string | null
      authorHandle: string | null
      authorAvatarUrl: string | null
      readsCount: number
      bookmarksCount: number
    }>
  >(Prisma.sql`
    ${baseSql}
    SELECT
      base.id,
      base.slug,
      base."title",
      base."summary",
      base."genre",
      base."workType",
      base."status",
      base."visibility",
      base."coverUrl",
      base."coverStorageKey",
      base."chaptersCount",
      base.rating,
      base."ratingsCount",
      base."publishedAt",
      base."updatedAt",
      base."authorDisplayName",
      base."authorId" AS "authorId",
      base."authorPubkey" AS "authorPubkey",
      base."authorName" AS "authorName",
      base."authorHandle" AS "authorHandle",
      base."authorAvatarUrl" AS "authorAvatarUrl",
      base."readsCount" AS "readsCount",
      base."bookmarksCount" AS "bookmarksCount"
    FROM catalog_base base
    ${collectionWhereSql}
    ${orderBySql}
    LIMIT ${pagination.take}
    OFFSET ${pagination.skip}
  `)

  return rows.map(mapLibraryCollectionNovelRow)
}

export async function countLibraryCollectionNovels(
  collection: CatalogCollection,
  filters: PublicCatalogNovelFilters = {}
) {
  const baseSql = buildLibraryCollectionBaseCte(filters)
  const collectionPredicateSql = buildLibraryCollectionPredicateSql(collection)
  const collectionWhereSql = collectionPredicateSql
    ? Prisma.sql`WHERE ${collectionPredicateSql}`
    : Prisma.empty
  const rows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
    ${baseSql}
    SELECT COUNT(*)::int AS total
    FROM catalog_base base
    ${collectionWhereSql}
  `)

  return rows[0]?.total ?? 0
}

export async function listLibraryCollectionFacetCounts(
  collection: CatalogCollection,
  filters: PublicCatalogNovelFilters = {}
): Promise<LibraryCollectionFacetCounts> {
  const baseSql = buildLibraryCollectionBaseCte(filters)
  const collectionPredicateSql = buildLibraryCollectionPredicateSql(collection)
  const collectionWhereSql = collectionPredicateSql
    ? Prisma.sql`WHERE ${collectionPredicateSql}`
    : Prisma.empty

  const [genres, workTypes, statuses, totalRows] = await Promise.all([
    prisma.$queryRaw<Array<{ value: string; count: number }>>(Prisma.sql`
      ${baseSql}
      SELECT base."genre" AS value, COUNT(*)::int AS count
      FROM catalog_base base
      ${collectionWhereSql}
      GROUP BY base."genre"
      ORDER BY count DESC, value ASC
      LIMIT 12
    `),
    prisma.$queryRaw<Array<{ value: "ORIGINAL" | "TRANSLATION"; count: number }>>(Prisma.sql`
      ${baseSql}
      SELECT base."workType" AS value, COUNT(*)::int AS count
      FROM catalog_base base
      ${collectionWhereSql}
      GROUP BY base."workType"
      ORDER BY count DESC, value ASC
    `),
    prisma.$queryRaw<Array<{ value: "Ongoing" | "Completed" | "Hiatus"; count: number }>>(Prisma.sql`
      ${baseSql}
      SELECT base."status" AS value, COUNT(*)::int AS count
      FROM catalog_base base
      ${collectionWhereSql}
      GROUP BY base."status"
      ORDER BY count DESC, value ASC
    `),
    prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
      ${baseSql}
      SELECT COUNT(*)::int AS total
      FROM catalog_base base
      ${collectionWhereSql}
    `),
  ])

  return {
    total: totalRows[0]?.total ?? 0,
    genres: genres.map((item) => ({
      value: item.value,
      label: item.value,
      count: item.count,
    })),
    workTypes: workTypes.map((item) => ({
      value: item.value,
      label: item.value === "TRANSLATION" ? "Translation" : "Original",
      count: item.count,
    })),
    statuses: statuses.map((item) => ({
      value: item.value,
      label: item.value,
      count: item.count,
    })),
  }
}

type LibraryCatalogCursorQueryInput = {
  sortBy?: CatalogSortBy
  pageSize?: number
  cursor?: LibraryCatalogKeysetCursor | null
  direction?: "next" | "prev" | null
  collection?: CatalogCollection | null
}

type LibraryCatalogCursorRow = LibraryCollectionNovelRow

function buildLibraryCatalogCursorWhereSql(
  sortBy: CatalogSortBy,
  cursor: LibraryCatalogKeysetCursor | null | undefined,
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
    if (isBackward) {
      return Prisma.sql`
        AND (
          base."readsCount" > ${cursor.readsCount ?? 0}
          OR (
            base."readsCount" = ${cursor.readsCount ?? 0}
            AND base."bookmarksCount" > ${cursor.bookmarksCount ?? 0}
          )
          OR (
            base."readsCount" = ${cursor.readsCount ?? 0}
            AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
            AND base."ratingsCount" > ${cursor.ratingsCount ?? 0}
          )
          OR (
            base."readsCount" = ${cursor.readsCount ?? 0}
            AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
            AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
            AND coalesce(base."publishedAt", base."updatedAt") > ${orderDate}
          )
          OR (
            base."readsCount" = ${cursor.readsCount ?? 0}
            AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
            AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
            AND coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
            AND base.id > ${cursor.id}
          )
        )
      `
    }

    return Prisma.sql`
      AND (
        base."readsCount" < ${cursor.readsCount ?? 0}
        OR (
          base."readsCount" = ${cursor.readsCount ?? 0}
          AND base."bookmarksCount" < ${cursor.bookmarksCount ?? 0}
        )
        OR (
          base."readsCount" = ${cursor.readsCount ?? 0}
          AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
          AND base."ratingsCount" < ${cursor.ratingsCount ?? 0}
        )
        OR (
          base."readsCount" = ${cursor.readsCount ?? 0}
          AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
          AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
          AND coalesce(base."publishedAt", base."updatedAt") < ${orderDate}
        )
        OR (
          base."readsCount" = ${cursor.readsCount ?? 0}
          AND base."bookmarksCount" = ${cursor.bookmarksCount ?? 0}
          AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
          AND coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
          AND base.id < ${cursor.id}
        )
      )
    `
  }

  if (sortBy === "rating") {
    if (isBackward) {
      return Prisma.sql`
        AND (
          base.rating > ${cursor.rating ?? 0}
          OR (
            base.rating = ${cursor.rating ?? 0}
            AND base."ratingsCount" > ${cursor.ratingsCount ?? 0}
          )
          OR (
            base.rating = ${cursor.rating ?? 0}
            AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
            AND coalesce(base."publishedAt", base."updatedAt") > ${orderDate}
          )
          OR (
            base.rating = ${cursor.rating ?? 0}
            AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
            AND coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
            AND base.id > ${cursor.id}
          )
        )
      `
    }

    return Prisma.sql`
      AND (
        base.rating < ${cursor.rating ?? 0}
        OR (
          base.rating = ${cursor.rating ?? 0}
          AND base."ratingsCount" < ${cursor.ratingsCount ?? 0}
        )
        OR (
          base.rating = ${cursor.rating ?? 0}
          AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
          AND coalesce(base."publishedAt", base."updatedAt") < ${orderDate}
        )
        OR (
          base.rating = ${cursor.rating ?? 0}
          AND base."ratingsCount" = ${cursor.ratingsCount ?? 0}
          AND coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
          AND base.id < ${cursor.id}
        )
      )
    `
  }

  if (sortBy === "title") {
    const normalizedTitle = cursor.title?.trim().toLocaleLowerCase() ?? ""

    if (isBackward) {
      return Prisma.sql`
        AND (
          lower(base."title") < ${normalizedTitle}
          OR (
            lower(base."title") = ${normalizedTitle}
            AND base.id < ${cursor.id}
          )
        )
      `
    }

    return Prisma.sql`
      AND (
        lower(base."title") > ${normalizedTitle}
        OR (
          lower(base."title") = ${normalizedTitle}
          AND base.id > ${cursor.id}
        )
      )
    `
  }

  if (isBackward) {
    return Prisma.sql`
      AND (
        coalesce(base."publishedAt", base."updatedAt") > ${orderDate}
        OR (
          coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
          AND base.id > ${cursor.id}
        )
      )
    `
  }

  return Prisma.sql`
    AND (
      coalesce(base."publishedAt", base."updatedAt") < ${orderDate}
      OR (
        coalesce(base."publishedAt", base."updatedAt") = ${orderDate}
        AND base.id < ${cursor.id}
      )
    )
  `
}

function buildLibraryCatalogCursorOrderBySql(
  sortBy: CatalogSortBy,
  direction: "next" | "prev" | null | undefined
) {
  const isBackward = direction === "prev"

  if (sortBy === "popular") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            base."readsCount" ASC,
            base."bookmarksCount" ASC,
            base."ratingsCount" ASC,
            coalesce(base."publishedAt", base."updatedAt") ASC,
            base.id ASC
        `
      : Prisma.sql`
          ORDER BY
            base."readsCount" DESC,
            base."bookmarksCount" DESC,
            base."ratingsCount" DESC,
            coalesce(base."publishedAt", base."updatedAt") DESC,
            base.id DESC
        `
  }

  if (sortBy === "rating") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            base.rating ASC,
            base."ratingsCount" ASC,
            coalesce(base."publishedAt", base."updatedAt") ASC,
            base.id ASC
        `
      : Prisma.sql`
          ORDER BY
            base.rating DESC,
            base."ratingsCount" DESC,
            coalesce(base."publishedAt", base."updatedAt") DESC,
            base.id DESC
        `
  }

  if (sortBy === "title") {
    return isBackward
      ? Prisma.sql`
          ORDER BY
            lower(base."title") DESC,
            base.id DESC
        `
      : Prisma.sql`
          ORDER BY
            lower(base."title") ASC,
            base.id ASC
        `
  }

  return isBackward
    ? Prisma.sql`
        ORDER BY
          coalesce(base."publishedAt", base."updatedAt") ASC,
          base.id ASC
      `
    : Prisma.sql`
        ORDER BY
          coalesce(base."publishedAt", base."updatedAt") DESC,
          base.id DESC
      `
}

export async function listLibraryCatalogNovelsByCursor(
  filters: PublicCatalogNovelFilters = {},
  input: LibraryCatalogCursorQueryInput = {}
) {
  const sortBy = input.sortBy ?? "recent"
  const pageSize =
    Number.isFinite(input.pageSize) && (input.pageSize ?? 0) > 0
      ? Math.min(MAX_CATALOG_PAGE_SIZE, Math.floor(input.pageSize!))
      : DEFAULT_LIBRARY_PAGE_SIZE
  const cursorWhereSql = buildLibraryCatalogCursorWhereSql(
    sortBy,
    input.cursor,
    input.direction
  )
  const orderBySql = buildLibraryCatalogCursorOrderBySql(sortBy, input.direction)
  const baseSql = buildLibraryCollectionBaseCte(filters)
  const collectionPredicateSql = input.collection
    ? buildLibraryCollectionPredicateSql(input.collection)
    : null
  const collectionWhereSql = collectionPredicateSql
    ? Prisma.sql`AND ${collectionPredicateSql}`
    : Prisma.empty

  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      slug: string
      title: string
      summary: string
      genre: string
      workType: "ORIGINAL" | "TRANSLATION"
      status: "Ongoing" | "Completed" | "Hiatus"
      visibility: "PUBLISHED" | "HIDDEN"
      coverUrl: string
      coverStorageKey: string | null
      chaptersCount: number
      rating: number
      ratingsCount: number
      publishedAt: Date | null
      updatedAt: Date
      authorDisplayName: string | null
      authorId: string
      authorPubkey: string
      authorName: string | null
      authorHandle: string | null
      authorAvatarUrl: string | null
      readsCount: number
      bookmarksCount: number
    }>
  >(Prisma.sql`
    ${baseSql}
    SELECT
      base.id,
      base.slug,
      base."title",
      base."summary",
      base."genre",
      base."workType",
      base."status",
      base."visibility",
      base."coverUrl",
      base."coverStorageKey",
      base."chaptersCount",
      base.rating,
      base."ratingsCount",
      base."publishedAt",
      base."updatedAt",
      base."authorDisplayName",
      base."authorId" AS "authorId",
      base."authorPubkey" AS "authorPubkey",
      base."authorName" AS "authorName",
      base."authorHandle" AS "authorHandle",
      base."authorAvatarUrl" AS "authorAvatarUrl",
      base."readsCount" AS "readsCount",
      base."bookmarksCount" AS "bookmarksCount"
    FROM catalog_base base
    WHERE 1 = 1
    ${collectionWhereSql}
    ${cursorWhereSql}
    ${orderBySql}
    LIMIT ${pageSize + 1}
  `)

  const hasMore = rows.length > pageSize
  const slicedRows = hasMore ? rows.slice(0, pageSize) : rows
  const orderedRows = input.direction === "prev" ? [...slicedRows].reverse() : slicedRows

  return {
    items: orderedRows.map(mapLibraryCollectionNovelRow),
    hasMore,
  }
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
