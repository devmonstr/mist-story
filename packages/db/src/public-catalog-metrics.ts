import { Prisma } from "@prisma/client"
import { prisma } from "./client"

function buildTrendingScoreSql(
  readsExpr: Prisma.Sql,
  bookmarksExpr: Prisma.Sql,
  ratingsExpr: Prisma.Sql,
  orderDateExpr: Prisma.Sql
) {
  return Prisma.sql`
    (
      (${readsExpr} * 1.25)
      + (${bookmarksExpr} * 3.0)
      + (${ratingsExpr} * 1.5)
      + GREATEST(
        0,
        30 - (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - ${orderDateExpr})) / 86400.0)
      )
    )::double precision
  `
}

export async function ensurePublicCatalogMetricsInfrastructure() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PublicNovelMetric" (
      "novelId" TEXT PRIMARY KEY REFERENCES "Novel"("id") ON DELETE CASCADE,
      "readsCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
      "authorPublishedNovelsCount" INTEGER NOT NULL DEFAULT 0,
      "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PublicAuthorMetric" (
      "authorId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
      "followersCount" INTEGER NOT NULL DEFAULT 0,
      "publishedNovelsCount" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PublicNovelMetric_trendingScore_idx"
    ON "PublicNovelMetric"("trendingScore" DESC);
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PublicNovelMetric_readsCount_idx"
    ON "PublicNovelMetric"("readsCount" DESC);
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PublicNovelMetric_bookmarksCount_idx"
    ON "PublicNovelMetric"("bookmarksCount" DESC);
  `)

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "PublicAuthorMetric_followersCount_idx"
    ON "PublicAuthorMetric"("followersCount" DESC);
  `)
}

async function refreshAllPublicAuthorMetrics() {
  await prisma.$executeRaw(Prisma.sql`
    WITH follower_counts AS (
      SELECT uf."followingId" AS "authorId", COUNT(*)::int AS "followersCount"
      FROM "UserFollow" uf
      GROUP BY uf."followingId"
    ),
    published_novel_counts AS (
      SELECT n."authorId" AS "authorId", COUNT(*)::int AS "publishedNovelsCount"
      FROM "Novel" n
      WHERE n."visibility" = 'PUBLISHED'
      GROUP BY n."authorId"
    )
    INSERT INTO "PublicAuthorMetric" (
      "authorId",
      "followersCount",
      "publishedNovelsCount",
      "updatedAt"
    )
    SELECT
      u.id,
      COALESCE(follower_counts."followersCount", 0)::int,
      COALESCE(published_novel_counts."publishedNovelsCount", 0)::int,
      CURRENT_TIMESTAMP
    FROM "User" u
    LEFT JOIN follower_counts ON follower_counts."authorId" = u.id
    LEFT JOIN published_novel_counts ON published_novel_counts."authorId" = u.id
    ON CONFLICT ("authorId") DO UPDATE
    SET
      "followersCount" = EXCLUDED."followersCount",
      "publishedNovelsCount" = EXCLUDED."publishedNovelsCount",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

async function refreshAllPublicNovelMetrics() {
  await prisma.$executeRaw(Prisma.sql`
    WITH reading_counts AS (
      SELECT rp."novelId", COUNT(*)::int AS "readsCount"
      FROM "ReadingProgress" rp
      GROUP BY rp."novelId"
    ),
    bookmark_counts AS (
      SELECT nb."novelId", COUNT(*)::int AS "bookmarksCount"
      FROM "NovelBookmark" nb
      GROUP BY nb."novelId"
    ),
    author_published_counts AS (
      SELECT n."authorId", COUNT(*)::int AS "publishedNovelsCount"
      FROM "Novel" n
      WHERE n."visibility" = 'PUBLISHED'
      GROUP BY n."authorId"
    )
    INSERT INTO "PublicNovelMetric" (
      "novelId",
      "readsCount",
      "bookmarksCount",
      "authorPublishedNovelsCount",
      "trendingScore",
      "updatedAt"
    )
    SELECT
      n.id,
      COALESCE(reading_counts."readsCount", 0)::int,
      COALESCE(bookmark_counts."bookmarksCount", 0)::int,
      COALESCE(author_published_counts."publishedNovelsCount", 0)::int,
      ${buildTrendingScoreSql(
        Prisma.sql`COALESCE(reading_counts."readsCount", 0)`,
        Prisma.sql`COALESCE(bookmark_counts."bookmarksCount", 0)`,
        Prisma.sql`COALESCE(n."ratingsCount", 0)`,
        Prisma.sql`coalesce(n."publishedAt", n."updatedAt")`
      )},
      CURRENT_TIMESTAMP
    FROM "Novel" n
    LEFT JOIN reading_counts ON reading_counts."novelId" = n.id
    LEFT JOIN bookmark_counts ON bookmark_counts."novelId" = n.id
    LEFT JOIN author_published_counts ON author_published_counts."authorId" = n."authorId"
    ON CONFLICT ("novelId") DO UPDATE
    SET
      "readsCount" = EXCLUDED."readsCount",
      "bookmarksCount" = EXCLUDED."bookmarksCount",
      "authorPublishedNovelsCount" = EXCLUDED."authorPublishedNovelsCount",
      "trendingScore" = EXCLUDED."trendingScore",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

async function refreshPublicNovelMetricsForNovel(novelId: string) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "PublicNovelMetric" (
      "novelId",
      "readsCount",
      "bookmarksCount",
      "authorPublishedNovelsCount",
      "trendingScore",
      "updatedAt"
    )
    SELECT
      n.id,
      (
        SELECT COUNT(*)::int
        FROM "ReadingProgress" rp
        WHERE rp."novelId" = n.id
      ) AS "readsCount",
      (
        SELECT COUNT(*)::int
        FROM "NovelBookmark" nb
        WHERE nb."novelId" = n.id
      ) AS "bookmarksCount",
      (
        SELECT COUNT(*)::int
        FROM "Novel" author_novel
        WHERE author_novel."authorId" = n."authorId"
          AND author_novel."visibility" = 'PUBLISHED'
      ) AS "authorPublishedNovelsCount",
      ${buildTrendingScoreSql(
        Prisma.sql`(
          SELECT COUNT(*)::int
          FROM "ReadingProgress" rp
          WHERE rp."novelId" = n.id
        )`,
        Prisma.sql`(
          SELECT COUNT(*)::int
          FROM "NovelBookmark" nb
          WHERE nb."novelId" = n.id
        )`,
        Prisma.sql`COALESCE(n."ratingsCount", 0)`,
        Prisma.sql`coalesce(n."publishedAt", n."updatedAt")`
      )},
      CURRENT_TIMESTAMP
    FROM "Novel" n
    WHERE n.id = ${novelId}
    ON CONFLICT ("novelId") DO UPDATE
    SET
      "readsCount" = EXCLUDED."readsCount",
      "bookmarksCount" = EXCLUDED."bookmarksCount",
      "authorPublishedNovelsCount" = EXCLUDED."authorPublishedNovelsCount",
      "trendingScore" = EXCLUDED."trendingScore",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

async function refreshPublicMetricsForAuthor(authorId: string) {
  await prisma.$executeRaw(Prisma.sql`
    WITH follower_counts AS (
      SELECT uf."followingId" AS "authorId", COUNT(*)::int AS "followersCount"
      FROM "UserFollow" uf
      WHERE uf."followingId" = ${authorId}
      GROUP BY uf."followingId"
    ),
    published_novel_counts AS (
      SELECT n."authorId" AS "authorId", COUNT(*)::int AS "publishedNovelsCount"
      FROM "Novel" n
      WHERE n."authorId" = ${authorId}
        AND n."visibility" = 'PUBLISHED'
      GROUP BY n."authorId"
    )
    INSERT INTO "PublicAuthorMetric" (
      "authorId",
      "followersCount",
      "publishedNovelsCount",
      "updatedAt"
    )
    SELECT
      u.id,
      COALESCE(follower_counts."followersCount", 0)::int,
      COALESCE(published_novel_counts."publishedNovelsCount", 0)::int,
      CURRENT_TIMESTAMP
    FROM "User" u
    LEFT JOIN follower_counts ON follower_counts."authorId" = u.id
    LEFT JOIN published_novel_counts ON published_novel_counts."authorId" = u.id
    WHERE u.id = ${authorId}
    ON CONFLICT ("authorId") DO UPDATE
    SET
      "followersCount" = EXCLUDED."followersCount",
      "publishedNovelsCount" = EXCLUDED."publishedNovelsCount",
      "updatedAt" = EXCLUDED."updatedAt"
  `)

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "PublicNovelMetric" (
      "novelId",
      "readsCount",
      "bookmarksCount",
      "authorPublishedNovelsCount",
      "trendingScore",
      "updatedAt"
    )
    SELECT
      n.id,
      (
        SELECT COUNT(*)::int
        FROM "ReadingProgress" rp
        WHERE rp."novelId" = n.id
      ) AS "readsCount",
      (
        SELECT COUNT(*)::int
        FROM "NovelBookmark" nb
        WHERE nb."novelId" = n.id
      ) AS "bookmarksCount",
      (
        SELECT COUNT(*)::int
        FROM "Novel" author_novel
        WHERE author_novel."authorId" = n."authorId"
          AND author_novel."visibility" = 'PUBLISHED'
      ) AS "authorPublishedNovelsCount",
      ${buildTrendingScoreSql(
        Prisma.sql`(
          SELECT COUNT(*)::int
          FROM "ReadingProgress" rp
          WHERE rp."novelId" = n.id
        )`,
        Prisma.sql`(
          SELECT COUNT(*)::int
          FROM "NovelBookmark" nb
          WHERE nb."novelId" = n.id
        )`,
        Prisma.sql`COALESCE(n."ratingsCount", 0)`,
        Prisma.sql`coalesce(n."publishedAt", n."updatedAt")`
      )},
      CURRENT_TIMESTAMP
    FROM "Novel" n
    WHERE n."authorId" = ${authorId}
    ON CONFLICT ("novelId") DO UPDATE
    SET
      "readsCount" = EXCLUDED."readsCount",
      "bookmarksCount" = EXCLUDED."bookmarksCount",
      "authorPublishedNovelsCount" = EXCLUDED."authorPublishedNovelsCount",
      "trendingScore" = EXCLUDED."trendingScore",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

export async function refreshPublicCatalogMetrics(input?: {
  scope?: "all" | "novel" | "author"
  novelId?: string | null
  authorId?: string | null
}) {
  const scope = input?.scope ?? "all"

  if (scope === "novel" && input?.novelId) {
    await refreshPublicNovelMetricsForNovel(input.novelId)
    return
  }

  if (scope === "author" && input?.authorId) {
    await refreshPublicMetricsForAuthor(input.authorId)
    return
  }

  await refreshAllPublicAuthorMetrics()
  await refreshAllPublicNovelMetrics()
}
