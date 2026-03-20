import * as api from "@/lib/api"

export interface LibraryCatalogNovel {
  id: string
  slug: string
  title: string
  summary: string
  workType: "ORIGINAL" | "TRANSLATION" | string
  status: "Ongoing" | "Completed" | "Hiatus" | string
  visibility: "PUBLISHED" | "HIDDEN" | string
  genre: string
  coverUrl: string
  coverStorageKey: string | null
  author: {
    id: string
    npub: string
    displayName: string | null
    avatarUrl: string | null
  }
  chaptersCount: number
  readsCount: number
  bookmarksCount: number
  rating: number
  ratingsCount: number
  publishedAt: string | null
  updatedAt: string
}

export interface LibraryCatalogResponse {
  novels: LibraryCatalogNovel[]
  total: number
  query: string
}

type CatalogApi = typeof api & {
  fetchLibraryCatalog?: (query?: string) => Promise<unknown>
}

const catalogApi = api as CatalogApi

function normalizeNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function normalizeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback
}

function normalizeNovel(value: unknown): LibraryCatalogNovel {
  const novel = (value ?? {}) as Record<string, unknown>
  const author = (novel.author ?? {}) as Record<string, unknown>

  return {
    id: normalizeString(novel.id),
    slug: normalizeString(novel.slug, normalizeString(novel.id)),
    title: normalizeString(novel.title),
    summary: normalizeString(novel.summary),
    workType: normalizeString(novel.workType, "ORIGINAL"),
    status: normalizeString(novel.status, "Ongoing"),
    visibility: normalizeString(novel.visibility, "PUBLISHED"),
    genre: normalizeString(novel.genre, "Other"),
    coverUrl: normalizeString(novel.coverUrl, normalizeString(novel.cover, "")),
    coverStorageKey:
      typeof novel.coverStorageKey === "string" ? novel.coverStorageKey : null,
    author: {
      id: normalizeString(author.id, normalizeString(novel.authorId, "")),
      npub: normalizeString(author.npub),
      displayName:
        typeof author.displayName === "string"
          ? author.displayName
          : typeof novel.authorDisplayName === "string"
            ? novel.authorDisplayName
            : typeof novel.author === "string"
              ? novel.author
              : null,
      avatarUrl:
        typeof author.avatarUrl === "string"
          ? author.avatarUrl
          : typeof novel.authorAvatarUrl === "string"
            ? novel.authorAvatarUrl
            : null,
    },
    chaptersCount: normalizeNumber(novel.chaptersCount, normalizeNumber(novel.chapterCount)),
    readsCount: normalizeNumber(
      novel.readsCount,
      normalizeNumber(novel.reads, normalizeNumber(novel.totalReads))
    ),
    bookmarksCount: normalizeNumber(novel.bookmarksCount, normalizeNumber(novel.bookmarks)),
    rating: normalizeNumber(novel.rating, 0),
    ratingsCount: normalizeNumber(novel.ratingsCount, normalizeNumber(novel.ratingCount)),
    publishedAt:
      typeof novel.publishedAt === "string"
        ? novel.publishedAt
        : typeof novel.published_at === "string"
          ? novel.published_at
          : null,
    updatedAt: normalizeString(novel.updatedAt, new Date().toISOString()),
  }
}

export function normalizeLibraryCatalogResponse(
  input: unknown,
  query: string
): LibraryCatalogResponse {
  if (Array.isArray(input)) {
    const novels = input.map(normalizeNovel)
    return {
      novels,
      total: novels.length,
      query,
    }
  }

  const response = (input ?? {}) as Record<string, unknown>
  const source =
    (Array.isArray(response.novels) && response.novels) ||
    (Array.isArray(response.items) && response.items) ||
    (Array.isArray(response.results) && response.results) ||
    []

  const novels = source.map(normalizeNovel)
  const total = normalizeNumber(
    response.total,
    normalizeNumber(response.count, novels.length)
  )

  return {
    novels,
    total,
    query: normalizeString(response.query, query),
  }
}

export async function loadLibraryCatalog(query = "") {
  if (!catalogApi.fetchLibraryCatalog) {
    throw new Error("Library catalog API is not available yet.")
  }

  const payload = await catalogApi.fetchLibraryCatalog(query.trim() || undefined)
  return normalizeLibraryCatalogResponse(payload, query.trim())
}
