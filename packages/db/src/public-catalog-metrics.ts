import { Prisma } from "@prisma/client"
import { randomUUID } from "node:crypto"
import { prisma } from "./client"

export type PublicCatalogMetricScope = "all" | "novel" | "author"

export type NovelActivityEventInput = {
  novelId: string
  userId?: string | null
  chapterId?: string | null
  eventType:
    | "READ"
    | "CHAPTER_READ"
    | "BOOKMARK_ADD"
    | "BOOKMARK_REMOVE"
    | "RATING_ADD"
    | "RATING_UPDATE"
    | "COMMENT_ADD"
    | "PURCHASE"
  eventValue?: number | null
  metadata?: Prisma.InputJsonValue | null
  occurredAt?: Date | null
}

const RANKING_SCORE_VERSION = "public-catalog-v1"

export async function ensurePublicCatalogMetricsInfrastructure() {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "NovelActivityEventType" AS ENUM (
        'READ',
        'CHAPTER_READ',
        'BOOKMARK_ADD',
        'BOOKMARK_REMOVE',
        'RATING_ADD',
        'RATING_UPDATE',
        'COMMENT_ADD',
        'PURCHASE'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      CREATE TYPE "PublicCatalogRankingCollection" AS ENUM (
        'TRENDING',
        'NEW_RELEASES',
        'HIDDEN_GEMS',
        'EDITORS_PICKS',
        'NEW_VOICES',
        'TOP_RATED',
        'TRANSLATIONS',
        'GENRE'
      );
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  for (const value of [
    "CHAPTER_READ",
    "BOOKMARK_ADD",
    "BOOKMARK_REMOVE",
    "RATING_ADD",
    "RATING_UPDATE",
    "COMMENT_ADD",
    "PURCHASE",
  ]) {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS '${value}'`
    )
  }

  for (const value of ["NEW_RELEASES", "TOP_RATED", "TRANSLATIONS", "GENRE"]) {
    await prisma.$executeRawUnsafe(
      `ALTER TYPE "PublicCatalogRankingCollection" ADD VALUE IF NOT EXISTS '${value}'`
    )
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PublicNovelMetric" (
      "novelId" TEXT PRIMARY KEY REFERENCES "Novel"("id") ON DELETE CASCADE,
      "readsCount" INTEGER NOT NULL DEFAULT 0,
      "reads7d" INTEGER NOT NULL DEFAULT 0,
      "reads30d" INTEGER NOT NULL DEFAULT 0,
      "uniqueReaders7d" INTEGER NOT NULL DEFAULT 0,
      "uniqueReaders30d" INTEGER NOT NULL DEFAULT 0,
      "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarks7d" INTEGER NOT NULL DEFAULT 0,
      "bookmarks30d" INTEGER NOT NULL DEFAULT 0,
      "ratings7d" INTEGER NOT NULL DEFAULT 0,
      "ratings30d" INTEGER NOT NULL DEFAULT 0,
      "authorPublishedNovelsCount" INTEGER NOT NULL DEFAULT 0,
      "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "freshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "hiddenGemScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PublicNovelMetric"
      ADD COLUMN IF NOT EXISTS "reads7d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "reads30d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "uniqueReaders7d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "uniqueReaders30d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bookmarks7d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "bookmarks30d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ratings7d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ratings30d" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "hotScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "freshnessScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "hiddenGemScore" DOUBLE PRECISION NOT NULL DEFAULT 0;
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NovelActivityEvent" (
      "id" TEXT PRIMARY KEY,
      "novelId" TEXT NOT NULL REFERENCES "Novel"("id") ON DELETE CASCADE,
      "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "userId" TEXT,
      "chapterId" TEXT,
      "eventType" "NovelActivityEventType" NOT NULL,
      "eventValue" INTEGER,
      "metadata" JSONB,
      "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "NovelActivityDaily" (
      "novelId" TEXT NOT NULL REFERENCES "Novel"("id") ON DELETE CASCADE,
      "day" DATE NOT NULL,
      "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "readsCount" INTEGER NOT NULL DEFAULT 0,
      "uniqueReadersCount" INTEGER NOT NULL DEFAULT 0,
      "chapterReadsCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarksAddedCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarksRemovedCount" INTEGER NOT NULL DEFAULT 0,
      "ratingsAddedCount" INTEGER NOT NULL DEFAULT 0,
      "ratingValueTotal" INTEGER NOT NULL DEFAULT 0,
      "commentsCount" INTEGER NOT NULL DEFAULT 0,
      "purchasesCount" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("novelId", "day")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuthorActivityDaily" (
      "authorId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
      "day" DATE NOT NULL,
      "readsCount" INTEGER NOT NULL DEFAULT 0,
      "uniqueReadersCount" INTEGER NOT NULL DEFAULT 0,
      "chapterReadsCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarksAddedCount" INTEGER NOT NULL DEFAULT 0,
      "bookmarksRemovedCount" INTEGER NOT NULL DEFAULT 0,
      "ratingsAddedCount" INTEGER NOT NULL DEFAULT 0,
      "ratingValueTotal" INTEGER NOT NULL DEFAULT 0,
      "commentsCount" INTEGER NOT NULL DEFAULT 0,
      "purchasesCount" INTEGER NOT NULL DEFAULT 0,
      "followsAddedCount" INTEGER NOT NULL DEFAULT 0,
      "followsRemovedCount" INTEGER NOT NULL DEFAULT 0,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("authorId", "day")
    );
  `)

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PublicCatalogRanking" (
      "collection" "PublicCatalogRankingCollection" NOT NULL,
      "contextKey" TEXT NOT NULL,
      "genre" TEXT,
      "workType" "NovelWorkType",
      "status" "NovelStatus",
      "novelId" TEXT NOT NULL REFERENCES "Novel"("id") ON DELETE CASCADE,
      "rank" INTEGER NOT NULL,
      "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "scoreVersion" TEXT NOT NULL DEFAULT 'public-catalog-v1',
      "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("collection", "contextKey", "novelId")
    );
  `)

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PublicCatalogRanking"
      ADD COLUMN IF NOT EXISTS "scoreVersion" TEXT NOT NULL DEFAULT 'public-catalog-v1';
  `)

  for (const statement of [
    `CREATE UNIQUE INDEX IF NOT EXISTS "PublicCatalogRanking_collection_contextKey_rank_key"
     ON "PublicCatalogRanking"("collection", "contextKey", "rank")`,
    `CREATE INDEX IF NOT EXISTS "NovelActivityEvent_novelId_occurredAt_idx"
     ON "NovelActivityEvent"("novelId", "occurredAt" DESC)`,
    `CREATE INDEX IF NOT EXISTS "NovelActivityEvent_authorId_occurredAt_idx"
     ON "NovelActivityEvent"("authorId", "occurredAt" DESC)`,
    `CREATE INDEX IF NOT EXISTS "NovelActivityDaily_authorId_day_idx"
     ON "NovelActivityDaily"("authorId", "day" DESC)`,
    `CREATE INDEX IF NOT EXISTS "PublicNovelMetric_trendingScore_idx"
     ON "PublicNovelMetric"("trendingScore" DESC)`,
    `CREATE INDEX IF NOT EXISTS "PublicNovelMetric_qualityScore_idx"
     ON "PublicNovelMetric"("qualityScore" DESC)`,
    `CREATE INDEX IF NOT EXISTS "PublicNovelMetric_hiddenGemScore_idx"
     ON "PublicNovelMetric"("hiddenGemScore" DESC)`,
    `CREATE INDEX IF NOT EXISTS "PublicCatalogRanking_collection_contextKey_rank_idx"
     ON "PublicCatalogRanking"("collection", "contextKey", "rank")`,
  ]) {
    await prisma.$executeRawUnsafe(statement)
  }
}

export async function recordNovelActivityEvent(input: NovelActivityEventInput) {
  await ensurePublicCatalogMetricsInfrastructure()

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "NovelActivityEvent" (
      "id",
      "novelId",
      "authorId",
      "userId",
      "chapterId",
      "eventType",
      "eventValue",
      "metadata",
      "occurredAt",
      "createdAt"
    )
    SELECT
      ${randomUUID()},
      n.id,
      n."authorId",
      ${input.userId ?? null},
      ${input.chapterId ?? null},
      CAST(${input.eventType} AS "NovelActivityEventType"),
      ${input.eventValue ?? null},
      ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
      ${input.occurredAt ?? new Date()},
      CURRENT_TIMESTAMP
    FROM "Novel" n
    WHERE n.id = ${input.novelId}
  `)
}

async function backfillCurrentActivityDaily() {
  await prisma.$executeRaw(Prisma.sql`
    WITH current_activity AS (
      SELECT
        n.id AS "novelId",
        CURRENT_DATE AS day,
        n."authorId",
        COALESCE(rp."readsCount", 0)::int AS "readsCount",
        COALESCE(rp."uniqueReadersCount", 0)::int AS "uniqueReadersCount",
        COALESCE(nb."bookmarksAddedCount", 0)::int AS "bookmarksAddedCount",
        COALESCE(rt."ratingsAddedCount", 0)::int AS "ratingsAddedCount",
        COALESCE(rt."ratingValueTotal", 0)::int AS "ratingValueTotal"
      FROM "Novel" n
      LEFT JOIN (
        SELECT "novelId", COUNT(*)::int AS "readsCount", COUNT(DISTINCT "userId")::int AS "uniqueReadersCount"
        FROM "ReadingProgress"
        GROUP BY "novelId"
      ) rp ON rp."novelId" = n.id
      LEFT JOIN (
        SELECT "novelId", COUNT(*)::int AS "bookmarksAddedCount"
        FROM "NovelBookmark"
        GROUP BY "novelId"
      ) nb ON nb."novelId" = n.id
      LEFT JOIN (
        SELECT "novelId", COUNT(*)::int AS "ratingsAddedCount", SUM(value)::int AS "ratingValueTotal"
        FROM "NovelRating"
        GROUP BY "novelId"
      ) rt ON rt."novelId" = n.id
      WHERE n."visibility" = 'PUBLISHED'
    )
    INSERT INTO "NovelActivityDaily" (
      "novelId",
      "day",
      "authorId",
      "readsCount",
      "uniqueReadersCount",
      "bookmarksAddedCount",
      "ratingsAddedCount",
      "ratingValueTotal",
      "updatedAt"
    )
    SELECT
      "novelId",
      day,
      "authorId",
      "readsCount",
      "uniqueReadersCount",
      "bookmarksAddedCount",
      "ratingsAddedCount",
      "ratingValueTotal",
      CURRENT_TIMESTAMP
    FROM current_activity
    ON CONFLICT ("novelId", "day") DO NOTHING
  `)
}

export async function rollupPublicCatalogActivity() {
  await ensurePublicCatalogMetricsInfrastructure()
  await backfillCurrentActivityDaily()

  await prisma.$executeRaw(Prisma.sql`
    WITH event_rollups AS (
      SELECT
        e."novelId",
        date_trunc('day', e."occurredAt")::date AS day,
        max(e."authorId") AS "authorId",
        COUNT(*) FILTER (WHERE e."eventType" IN ('READ', 'CHAPTER_READ'))::int AS "readsCount",
        COUNT(DISTINCT e."userId") FILTER (
          WHERE e."eventType" IN ('READ', 'CHAPTER_READ') AND e."userId" IS NOT NULL
        )::int AS "uniqueReadersCount",
        COUNT(*) FILTER (WHERE e."eventType" = 'CHAPTER_READ')::int AS "chapterReadsCount",
        COUNT(*) FILTER (WHERE e."eventType" = 'BOOKMARK_ADD')::int AS "bookmarksAddedCount",
        COUNT(*) FILTER (WHERE e."eventType" = 'BOOKMARK_REMOVE')::int AS "bookmarksRemovedCount",
        COUNT(*) FILTER (WHERE e."eventType" IN ('RATING_ADD', 'RATING_UPDATE'))::int AS "ratingsAddedCount",
        COALESCE(SUM(e."eventValue") FILTER (
          WHERE e."eventType" IN ('RATING_ADD', 'RATING_UPDATE')
        ), 0)::int AS "ratingValueTotal",
        COUNT(*) FILTER (WHERE e."eventType" = 'COMMENT_ADD')::int AS "commentsCount",
        COUNT(*) FILTER (WHERE e."eventType" = 'PURCHASE')::int AS "purchasesCount"
      FROM "NovelActivityEvent" e
      WHERE e."occurredAt" >= CURRENT_DATE - INTERVAL '35 days'
      GROUP BY e."novelId", date_trunc('day', e."occurredAt")::date
    )
    INSERT INTO "NovelActivityDaily" (
      "novelId",
      "day",
      "authorId",
      "readsCount",
      "uniqueReadersCount",
      "chapterReadsCount",
      "bookmarksAddedCount",
      "bookmarksRemovedCount",
      "ratingsAddedCount",
      "ratingValueTotal",
      "commentsCount",
      "purchasesCount",
      "updatedAt"
    )
    SELECT
      "novelId",
      day,
      "authorId",
      "readsCount",
      "uniqueReadersCount",
      "chapterReadsCount",
      "bookmarksAddedCount",
      "bookmarksRemovedCount",
      "ratingsAddedCount",
      "ratingValueTotal",
      "commentsCount",
      "purchasesCount",
      CURRENT_TIMESTAMP
    FROM event_rollups
    ON CONFLICT ("novelId", "day") DO UPDATE
    SET
      "authorId" = EXCLUDED."authorId",
      "readsCount" = GREATEST("NovelActivityDaily"."readsCount", EXCLUDED."readsCount"),
      "uniqueReadersCount" = GREATEST("NovelActivityDaily"."uniqueReadersCount", EXCLUDED."uniqueReadersCount"),
      "chapterReadsCount" = GREATEST("NovelActivityDaily"."chapterReadsCount", EXCLUDED."chapterReadsCount"),
      "bookmarksAddedCount" = GREATEST("NovelActivityDaily"."bookmarksAddedCount", EXCLUDED."bookmarksAddedCount"),
      "bookmarksRemovedCount" = GREATEST("NovelActivityDaily"."bookmarksRemovedCount", EXCLUDED."bookmarksRemovedCount"),
      "ratingsAddedCount" = GREATEST("NovelActivityDaily"."ratingsAddedCount", EXCLUDED."ratingsAddedCount"),
      "ratingValueTotal" = GREATEST("NovelActivityDaily"."ratingValueTotal", EXCLUDED."ratingValueTotal"),
      "commentsCount" = GREATEST("NovelActivityDaily"."commentsCount", EXCLUDED."commentsCount"),
      "purchasesCount" = GREATEST("NovelActivityDaily"."purchasesCount", EXCLUDED."purchasesCount"),
      "updatedAt" = CURRENT_TIMESTAMP
  `)

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "AuthorActivityDaily" (
      "authorId",
      "day",
      "readsCount",
      "uniqueReadersCount",
      "chapterReadsCount",
      "bookmarksAddedCount",
      "bookmarksRemovedCount",
      "ratingsAddedCount",
      "ratingValueTotal",
      "commentsCount",
      "purchasesCount",
      "followsAddedCount",
      "updatedAt"
    )
    SELECT
      daily."authorId",
      daily.day,
      SUM(daily."readsCount")::int,
      SUM(daily."uniqueReadersCount")::int,
      SUM(daily."chapterReadsCount")::int,
      SUM(daily."bookmarksAddedCount")::int,
      SUM(daily."bookmarksRemovedCount")::int,
      SUM(daily."ratingsAddedCount")::int,
      SUM(daily."ratingValueTotal")::int,
      SUM(daily."commentsCount")::int,
      SUM(daily."purchasesCount")::int,
      COALESCE(follows."followsAddedCount", 0)::int,
      CURRENT_TIMESTAMP
    FROM "NovelActivityDaily" daily
    LEFT JOIN (
      SELECT
        "followingId" AS "authorId",
        date_trunc('day', "createdAt")::date AS day,
        COUNT(*)::int AS "followsAddedCount"
      FROM "UserFollow"
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '35 days'
      GROUP BY "followingId", date_trunc('day', "createdAt")::date
    ) follows ON follows."authorId" = daily."authorId" AND follows.day = daily.day
    WHERE daily.day >= CURRENT_DATE - INTERVAL '35 days'
    GROUP BY daily."authorId", daily.day, follows."followsAddedCount"
    ON CONFLICT ("authorId", "day") DO UPDATE
    SET
      "readsCount" = EXCLUDED."readsCount",
      "uniqueReadersCount" = EXCLUDED."uniqueReadersCount",
      "chapterReadsCount" = EXCLUDED."chapterReadsCount",
      "bookmarksAddedCount" = EXCLUDED."bookmarksAddedCount",
      "bookmarksRemovedCount" = EXCLUDED."bookmarksRemovedCount",
      "ratingsAddedCount" = EXCLUDED."ratingsAddedCount",
      "ratingValueTotal" = EXCLUDED."ratingValueTotal",
      "commentsCount" = EXCLUDED."commentsCount",
      "purchasesCount" = EXCLUDED."purchasesCount",
      "followsAddedCount" = EXCLUDED."followsAddedCount",
      "updatedAt" = CURRENT_TIMESTAMP
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
    ),
    rolling AS (
      SELECT
        "authorId",
        SUM("followsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "followers7d",
        SUM("followsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "followers30d",
        SUM("readsCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "reads7d",
        SUM("readsCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "reads30d",
        SUM("bookmarksAddedCount" - "bookmarksRemovedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "bookmarks7d",
        SUM("bookmarksAddedCount" - "bookmarksRemovedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "bookmarks30d",
        SUM("ratingsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "ratings7d",
        SUM("ratingsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "ratings30d"
      FROM "AuthorActivityDaily"
      WHERE day >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "authorId"
    )
    INSERT INTO "PublicAuthorMetric" (
      "authorId",
      "followersCount",
      "followers7d",
      "followers30d",
      "publishedNovelsCount",
      "reads7d",
      "reads30d",
      "bookmarks7d",
      "bookmarks30d",
      "ratings7d",
      "ratings30d",
      "momentumScore",
      "qualityScore",
      "updatedAt"
    )
    SELECT
      u.id,
      COALESCE(follower_counts."followersCount", 0)::int,
      COALESCE(rolling."followers7d", 0)::int,
      COALESCE(rolling."followers30d", 0)::int,
      COALESCE(published_novel_counts."publishedNovelsCount", 0)::int,
      COALESCE(rolling."reads7d", 0)::int,
      COALESCE(rolling."reads30d", 0)::int,
      COALESCE(rolling."bookmarks7d", 0)::int,
      COALESCE(rolling."bookmarks30d", 0)::int,
      COALESCE(rolling."ratings7d", 0)::int,
      COALESCE(rolling."ratings30d", 0)::int,
      (
        COALESCE(rolling."reads7d", 0)
        + COALESCE(rolling."bookmarks7d", 0) * 4
        + COALESCE(rolling."followers7d", 0) * 3
      )::double precision,
      (
        COALESCE(rolling."bookmarks30d", 0) * 2
        + COALESCE(rolling."ratings30d", 0) * 2
      )::double precision,
      CURRENT_TIMESTAMP
    FROM "User" u
    LEFT JOIN follower_counts ON follower_counts."authorId" = u.id
    LEFT JOIN published_novel_counts ON published_novel_counts."authorId" = u.id
    LEFT JOIN rolling ON rolling."authorId" = u.id
    ON CONFLICT ("authorId") DO UPDATE
    SET
      "followersCount" = EXCLUDED."followersCount",
      "followers7d" = EXCLUDED."followers7d",
      "followers30d" = EXCLUDED."followers30d",
      "publishedNovelsCount" = EXCLUDED."publishedNovelsCount",
      "reads7d" = EXCLUDED."reads7d",
      "reads30d" = EXCLUDED."reads30d",
      "bookmarks7d" = EXCLUDED."bookmarks7d",
      "bookmarks30d" = EXCLUDED."bookmarks30d",
      "ratings7d" = EXCLUDED."ratings7d",
      "ratings30d" = EXCLUDED."ratings30d",
      "momentumScore" = EXCLUDED."momentumScore",
      "qualityScore" = EXCLUDED."qualityScore",
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
    ),
    rolling AS (
      SELECT
        "novelId",
        SUM("readsCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "reads7d",
        SUM("readsCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "reads30d",
        SUM("uniqueReadersCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "uniqueReaders7d",
        SUM("uniqueReadersCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "uniqueReaders30d",
        SUM("bookmarksAddedCount" - "bookmarksRemovedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "bookmarks7d",
        SUM("bookmarksAddedCount" - "bookmarksRemovedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "bookmarks30d",
        SUM("ratingsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "ratings7d",
        SUM("ratingsAddedCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '30 days')::int AS "ratings30d",
        SUM("commentsCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "comments7d",
        SUM("purchasesCount") FILTER (WHERE day >= CURRENT_DATE - INTERVAL '7 days')::int AS "purchases7d"
      FROM "NovelActivityDaily"
      WHERE day >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY "novelId"
    ),
    scored AS (
      SELECT
        n.id,
        COALESCE(reading_counts."readsCount", 0)::int AS "readsCount",
        COALESCE(bookmark_counts."bookmarksCount", 0)::int AS "bookmarksCount",
        COALESCE(author_published_counts."publishedNovelsCount", 0)::int AS "authorPublishedNovelsCount",
        COALESCE(rolling."reads7d", 0)::int AS "reads7d",
        COALESCE(rolling."reads30d", 0)::int AS "reads30d",
        COALESCE(rolling."uniqueReaders7d", 0)::int AS "uniqueReaders7d",
        COALESCE(rolling."uniqueReaders30d", 0)::int AS "uniqueReaders30d",
        COALESCE(rolling."bookmarks7d", 0)::int AS "bookmarks7d",
        COALESCE(rolling."bookmarks30d", 0)::int AS "bookmarks30d",
        COALESCE(rolling."ratings7d", 0)::int AS "ratings7d",
        COALESCE(rolling."ratings30d", 0)::int AS "ratings30d",
        (
          COALESCE(rolling."reads7d", 0)
          + COALESCE(rolling."uniqueReaders7d", 0) * 1.5
          + COALESCE(rolling."bookmarks7d", 0) * 4
          + COALESCE(rolling."ratings7d", 0) * 2
          + COALESCE(rolling."comments7d", 0)
          + COALESCE(rolling."purchases7d", 0) * 5
        )::double precision AS "hotScore",
        GREATEST(
          0,
          30 - (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(n."publishedAt", n."updatedAt"))) / 86400.0)
        )::double precision AS "freshnessScore",
        (
          n.rating::double precision * LEAST(COALESCE(n."ratingsCount", 0) / 10.0, 1)
          + (
            COALESCE(bookmark_counts."bookmarksCount", 0)::double precision
            / GREATEST(COALESCE(reading_counts."readsCount", 0), 1)
          )
        )::double precision AS "qualityScore"
      FROM "Novel" n
      LEFT JOIN reading_counts ON reading_counts."novelId" = n.id
      LEFT JOIN bookmark_counts ON bookmark_counts."novelId" = n.id
      LEFT JOIN author_published_counts ON author_published_counts."authorId" = n."authorId"
      LEFT JOIN rolling ON rolling."novelId" = n.id
    )
    INSERT INTO "PublicNovelMetric" (
      "novelId",
      "readsCount",
      "reads7d",
      "reads30d",
      "uniqueReaders7d",
      "uniqueReaders30d",
      "bookmarksCount",
      "bookmarks7d",
      "bookmarks30d",
      "ratings7d",
      "ratings30d",
      "authorPublishedNovelsCount",
      "hotScore",
      "momentumScore",
      "freshnessScore",
      "trendingScore",
      "qualityScore",
      "hiddenGemScore",
      "updatedAt"
    )
    SELECT
      id,
      "readsCount",
      "reads7d",
      "reads30d",
      "uniqueReaders7d",
      "uniqueReaders30d",
      "bookmarksCount",
      "bookmarks7d",
      "bookmarks30d",
      "ratings7d",
      "ratings30d",
      "authorPublishedNovelsCount",
      "hotScore",
      "hotScore",
      "freshnessScore",
      ("hotScore" + "freshnessScore")::double precision,
      "qualityScore",
      ("qualityScore" + ("bookmarks7d" * 2) - (LEAST("reads30d", 100) * 0.05))::double precision,
      CURRENT_TIMESTAMP
    FROM scored
    ON CONFLICT ("novelId") DO UPDATE
    SET
      "readsCount" = EXCLUDED."readsCount",
      "reads7d" = EXCLUDED."reads7d",
      "reads30d" = EXCLUDED."reads30d",
      "uniqueReaders7d" = EXCLUDED."uniqueReaders7d",
      "uniqueReaders30d" = EXCLUDED."uniqueReaders30d",
      "bookmarksCount" = EXCLUDED."bookmarksCount",
      "bookmarks7d" = EXCLUDED."bookmarks7d",
      "bookmarks30d" = EXCLUDED."bookmarks30d",
      "ratings7d" = EXCLUDED."ratings7d",
      "ratings30d" = EXCLUDED."ratings30d",
      "authorPublishedNovelsCount" = EXCLUDED."authorPublishedNovelsCount",
      "hotScore" = EXCLUDED."hotScore",
      "momentumScore" = EXCLUDED."momentumScore",
      "freshnessScore" = EXCLUDED."freshnessScore",
      "trendingScore" = EXCLUDED."trendingScore",
      "qualityScore" = EXCLUDED."qualityScore",
      "hiddenGemScore" = EXCLUDED."hiddenGemScore",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

async function insertRanking(
  collection: string,
  scoreExpression: Prisma.Sql,
  whereSql: Prisma.Sql = Prisma.empty
) {
  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO "PublicCatalogRanking" (
      "collection",
      "contextKey",
      "novelId",
      "rank",
      "score",
      "qualityScore",
      "momentumScore",
      "trendingScore",
      "scoreVersion",
      "computedAt",
      "createdAt",
      "updatedAt"
    )
    SELECT
      CAST(${collection} AS "PublicCatalogRankingCollection"),
      'global',
      ranked.id,
      ranked.rank,
      ranked.score,
      ranked."qualityScore",
      ranked."momentumScore",
      ranked."trendingScore",
      ${RANKING_SCORE_VERSION},
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    FROM (
      SELECT
        n.id,
        ROW_NUMBER() OVER (
          ORDER BY ${scoreExpression} DESC, COALESCE(n."publishedAt", n."updatedAt") DESC, n.id DESC
        )::int AS rank,
        ${scoreExpression}::double precision AS score,
        COALESCE(metric."qualityScore", 0)::double precision AS "qualityScore",
        COALESCE(metric."momentumScore", 0)::double precision AS "momentumScore",
        COALESCE(metric."trendingScore", 0)::double precision AS "trendingScore"
      FROM "Novel" n
      LEFT JOIN "PublicNovelMetric" metric ON metric."novelId" = n.id
      WHERE n."visibility" = 'PUBLISHED'
      ${whereSql}
      LIMIT 100
    ) ranked
    ON CONFLICT ("collection", "contextKey", "novelId") DO UPDATE
    SET
      rank = EXCLUDED.rank,
      score = EXCLUDED.score,
      "qualityScore" = EXCLUDED."qualityScore",
      "momentumScore" = EXCLUDED."momentumScore",
      "trendingScore" = EXCLUDED."trendingScore",
      "scoreVersion" = EXCLUDED."scoreVersion",
      "computedAt" = EXCLUDED."computedAt",
      "updatedAt" = EXCLUDED."updatedAt"
  `)
}

export async function refreshPublicCatalogRankings() {
  await ensurePublicCatalogMetricsInfrastructure()
  await prisma.$executeRaw(Prisma.sql`
    DELETE FROM "PublicCatalogRanking"
    WHERE "contextKey" = 'global'
      AND "collection" IN (
        'TRENDING',
        'NEW_RELEASES',
        'HIDDEN_GEMS',
        'EDITORS_PICKS',
        'NEW_VOICES',
        'TOP_RATED',
        'TRANSLATIONS'
      )
  `)

  await insertRanking("TRENDING", Prisma.sql`COALESCE(metric."trendingScore", 0)`)
  await insertRanking(
    "NEW_RELEASES",
    Prisma.sql`EXTRACT(EPOCH FROM COALESCE(n."publishedAt", n."updatedAt"))`
  )
  await insertRanking("HIDDEN_GEMS", Prisma.sql`COALESCE(metric."hiddenGemScore", 0)`)
  await insertRanking("EDITORS_PICKS", Prisma.sql`COALESCE(metric."qualityScore", 0)`)
  await insertRanking(
    "NEW_VOICES",
    Prisma.sql`COALESCE(metric."freshnessScore", 0) + COALESCE(metric."qualityScore", 0)`,
    Prisma.sql`AND COALESCE(metric."authorPublishedNovelsCount", 0) <= 1`
  )
  await insertRanking("TOP_RATED", Prisma.sql`COALESCE(metric."qualityScore", 0)`)
  await insertRanking(
    "TRANSLATIONS",
    Prisma.sql`COALESCE(metric."qualityScore", 0) + COALESCE(metric."trendingScore", 0)`,
    Prisma.sql`AND n."workType" = 'TRANSLATION'`
  )
}

export async function refreshPublicCatalogMetrics(_input?: {
  scope?: PublicCatalogMetricScope
  novelId?: string | null
  authorId?: string | null
}) {
  void _input
  await ensurePublicCatalogMetricsInfrastructure()
  await rollupPublicCatalogActivity()
  await refreshAllPublicAuthorMetrics()
  await refreshAllPublicNovelMetrics()
}
