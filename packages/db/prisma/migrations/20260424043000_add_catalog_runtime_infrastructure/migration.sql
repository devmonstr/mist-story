CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION myth_novel_search_document(
  title text,
  author_display_name text,
  genre text,
  tags text[],
  subgenres text[],
  summary text
) RETURNS tsvector
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(author_display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(genre, '')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(tags, ARRAY[]::text[]), ' ')), 'B') ||
    setweight(to_tsvector('simple', array_to_string(coalesce(subgenres, ARRAY[]::text[]), ' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'C')
$$;

CREATE OR REPLACE FUNCTION myth_user_search_document(
  display_name text,
  handle text,
  nip05 text,
  about text
) RETURNS tsvector
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT
    setweight(to_tsvector('simple', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(handle, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(nip05, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(about, '')), 'C')
$$;

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

ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'CHAPTER_READ';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'BOOKMARK_ADD';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'BOOKMARK_REMOVE';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'RATING_ADD';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'RATING_UPDATE';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'COMMENT_ADD';
ALTER TYPE "NovelActivityEventType" ADD VALUE IF NOT EXISTS 'PURCHASE';

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

ALTER TYPE "PublicCatalogRankingCollection" ADD VALUE IF NOT EXISTS 'NEW_RELEASES';
ALTER TYPE "PublicCatalogRankingCollection" ADD VALUE IF NOT EXISTS 'TOP_RATED';
ALTER TYPE "PublicCatalogRankingCollection" ADD VALUE IF NOT EXISTS 'TRANSLATIONS';
ALTER TYPE "PublicCatalogRankingCollection" ADD VALUE IF NOT EXISTS 'GENRE';

CREATE TABLE IF NOT EXISTS "PublicNovelMetric" (
  "novelId" TEXT PRIMARY KEY REFERENCES "Novel"("id") ON DELETE CASCADE,
  "readsCount" INTEGER NOT NULL DEFAULT 0,
  "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
  "authorPublishedNovelsCount" INTEGER NOT NULL DEFAULT 0,
  "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS "PublicAuthorMetric" (
  "authorId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "followersCount" INTEGER NOT NULL DEFAULT 0,
  "publishedNovelsCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "PublicAuthorMetric"
  ADD COLUMN IF NOT EXISTS "followers7d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "followers30d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reads7d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "reads30d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarks7d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarks30d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratings7d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratings30d" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "NovelActivityEvent" (
  "id" TEXT NOT NULL,
  "novelId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "userId" TEXT,
  "chapterId" TEXT,
  "eventType" "NovelActivityEventType" NOT NULL,
  "eventValue" INTEGER,
  "metadata" JSONB,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NovelActivityEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NovelActivityEvent_novelId_fkey"
    FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NovelActivityEvent_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "NovelActivityEvent"
  ADD COLUMN IF NOT EXISTS "chapterId" TEXT;

CREATE TABLE IF NOT EXISTS "NovelActivityDaily" (
  "novelId" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "authorId" TEXT NOT NULL,
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
  CONSTRAINT "NovelActivityDaily_pkey" PRIMARY KEY ("novelId", "day"),
  CONSTRAINT "NovelActivityDaily_novelId_fkey"
    FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NovelActivityDaily_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "NovelActivityDaily"
  ADD COLUMN IF NOT EXISTS "uniqueReadersCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "chapterReadsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarksAddedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarksRemovedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratingsAddedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "commentsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "purchasesCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "AuthorActivityDaily" (
  "authorId" TEXT NOT NULL,
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
  CONSTRAINT "AuthorActivityDaily_pkey" PRIMARY KEY ("authorId", "day"),
  CONSTRAINT "AuthorActivityDaily_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "AuthorActivityDaily"
  ADD COLUMN IF NOT EXISTS "uniqueReadersCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "chapterReadsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarksAddedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bookmarksRemovedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ratingsAddedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "commentsCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "purchasesCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "followsAddedCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "followsRemovedCount" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "PublicCatalogRanking" (
  "collection" "PublicCatalogRankingCollection" NOT NULL,
  "contextKey" TEXT NOT NULL,
  "genre" TEXT,
  "workType" "NovelWorkType",
  "status" "NovelStatus",
  "novelId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "momentumScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "scoreVersion" TEXT NOT NULL DEFAULT 'public-catalog-v1',
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublicCatalogRanking_pkey" PRIMARY KEY ("collection", "contextKey", "novelId"),
  CONSTRAINT "PublicCatalogRanking_novelId_fkey"
    FOREIGN KEY ("novelId") REFERENCES "Novel"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "PublicCatalogRanking"
  ADD COLUMN IF NOT EXISTS "scoreVersion" TEXT NOT NULL DEFAULT 'public-catalog-v1';

CREATE UNIQUE INDEX IF NOT EXISTS "PublicCatalogRanking_collection_contextKey_rank_key"
  ON "PublicCatalogRanking"("collection", "contextKey", "rank");

CREATE INDEX IF NOT EXISTS "Novel_title_trgm_idx" ON "Novel" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Novel_summary_trgm_idx" ON "Novel" USING GIN ("summary" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Novel_authorDisplayName_trgm_idx" ON "Novel" USING GIN ("authorDisplayName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Novel_genre_trgm_idx" ON "Novel" USING GIN ("genre" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Novel_tags_gin_idx" ON "Novel" USING GIN ("tags");
CREATE INDEX IF NOT EXISTS "Novel_subgenres_gin_idx" ON "Novel" USING GIN ("subgenres");
CREATE INDEX IF NOT EXISTS "User_displayName_trgm_idx" ON "User" USING GIN ("displayName" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_handle_trgm_idx" ON "User" USING GIN ("handle" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_about_trgm_idx" ON "User" USING GIN ("about" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "User_nip05_trgm_idx" ON "User" USING GIN ("nip05" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Novel_public_search_tsv_idx" ON "Novel" USING GIN (myth_novel_search_document("title", "authorDisplayName", "genre", "tags", "subgenres", "summary"));
CREATE INDEX IF NOT EXISTS "User_public_search_tsv_idx" ON "User" USING GIN (myth_user_search_document("displayName", "handle", "nip05", "about"));
CREATE INDEX IF NOT EXISTS "Novel_visibility_publishedAt_id_idx" ON "Novel"("visibility", "publishedAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "Novel_visibility_genre_publishedAt_id_idx" ON "Novel"("visibility", "genre", "publishedAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "Novel_visibility_workType_publishedAt_id_idx" ON "Novel"("visibility", "workType", "publishedAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "Novel_visibility_status_publishedAt_id_idx" ON "Novel"("visibility", "status", "publishedAt" DESC, "id" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityEvent_novelId_occurredAt_idx"
  ON "NovelActivityEvent"("novelId", "occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityEvent_authorId_occurredAt_idx"
  ON "NovelActivityEvent"("authorId", "occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityEvent_eventType_occurredAt_idx"
  ON "NovelActivityEvent"("eventType", "occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityEvent_novelId_eventType_occurredAt_idx"
  ON "NovelActivityEvent"("novelId", "eventType", "occurredAt" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityDaily_authorId_day_idx"
  ON "NovelActivityDaily"("authorId", "day" DESC);
CREATE INDEX IF NOT EXISTS "NovelActivityDaily_day_idx"
  ON "NovelActivityDaily"("day" DESC);
CREATE INDEX IF NOT EXISTS "AuthorActivityDaily_day_idx"
  ON "AuthorActivityDaily"("day" DESC);
CREATE INDEX IF NOT EXISTS "PublicNovelMetric_trendingScore_idx" ON "PublicNovelMetric"("trendingScore" DESC);
CREATE INDEX IF NOT EXISTS "PublicNovelMetric_qualityScore_idx" ON "PublicNovelMetric"("qualityScore" DESC);
CREATE INDEX IF NOT EXISTS "PublicNovelMetric_hiddenGemScore_idx" ON "PublicNovelMetric"("hiddenGemScore" DESC);
CREATE INDEX IF NOT EXISTS "PublicNovelMetric_readsCount_idx" ON "PublicNovelMetric"("readsCount" DESC);
CREATE INDEX IF NOT EXISTS "PublicNovelMetric_bookmarksCount_idx" ON "PublicNovelMetric"("bookmarksCount" DESC);
CREATE INDEX IF NOT EXISTS "PublicAuthorMetric_followersCount_idx" ON "PublicAuthorMetric"("followersCount" DESC);
CREATE INDEX IF NOT EXISTS "PublicAuthorMetric_qualityScore_idx" ON "PublicAuthorMetric"("qualityScore" DESC);
CREATE INDEX IF NOT EXISTS "PublicCatalogRanking_collection_contextKey_rank_idx"
  ON "PublicCatalogRanking"("collection", "contextKey", "rank");
CREATE INDEX IF NOT EXISTS "PublicCatalogRanking_collection_contextKey_score_idx"
  ON "PublicCatalogRanking"("collection", "contextKey", "score" DESC);
