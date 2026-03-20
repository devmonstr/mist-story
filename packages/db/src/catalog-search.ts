import { prisma } from "./client"

const SEARCH_INFRA_SQL = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `CREATE OR REPLACE FUNCTION mist_novel_search_document(
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
  $$`,
  `CREATE OR REPLACE FUNCTION mist_user_search_document(
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
  $$`,
  `CREATE INDEX IF NOT EXISTS "Novel_title_trgm_idx" ON "Novel" USING GIN ("title" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Novel_summary_trgm_idx" ON "Novel" USING GIN ("summary" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Novel_authorDisplayName_trgm_idx" ON "Novel" USING GIN ("authorDisplayName" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Novel_genre_trgm_idx" ON "Novel" USING GIN ("genre" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "User_displayName_trgm_idx" ON "User" USING GIN ("displayName" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "User_handle_trgm_idx" ON "User" USING GIN ("handle" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "User_about_trgm_idx" ON "User" USING GIN ("about" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "User_nip05_trgm_idx" ON "User" USING GIN ("nip05" gin_trgm_ops)`,
  `CREATE INDEX IF NOT EXISTS "Novel_public_search_tsv_idx" ON "Novel" USING GIN (mist_novel_search_document("title", "authorDisplayName", "genre", "tags", "subgenres", "summary"))`,
  `CREATE INDEX IF NOT EXISTS "User_public_search_tsv_idx" ON "User" USING GIN (mist_user_search_document("displayName", "handle", "nip05", "about"))`,
]

let prepared = false

export async function ensureCatalogSearchInfrastructure() {
  if (prepared) {
    return
  }

  for (const statement of SEARCH_INFRA_SQL) {
    await prisma.$executeRawUnsafe(statement)
  }

  prepared = true
}
