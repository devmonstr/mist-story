import type { CatalogSortBy } from "@mist/shared"

type PageCursorPayload = {
  kind: "page"
  page: number
}

export type LibraryCatalogCursorPayload = {
  kind: "library"
  sortBy: CatalogSortBy
  id: string
  orderDate: string
  readsCount?: number
  bookmarksCount?: number
  ratingsCount?: number
  rating?: number
  title?: string
}

export type SearchNovelCursorPayload = {
  kind: "search-novel"
  sortBy: "relevance" | "popular" | "recent"
  id: string
  readsCount: number
  bookmarksCount: number
  ratingsCount: number
  orderDate: string
  rankScore?: number
  similarityScore?: number
}

export type SearchAuthorCursorPayload = {
  kind: "search-author"
  sortBy: "relevance" | "popular" | "recent"
  id: string
  followersCount: number
  novelsCount: number
  updatedAt: string
  rankScore?: number
  similarityScore?: number
}

export function encodeCatalogCursor(page: number) {
  return Buffer.from(
    JSON.stringify({ kind: "page", page } satisfies PageCursorPayload)
  ).toString("base64url")
}

export function decodeCatalogCursor(cursor: string | undefined | null) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<PageCursorPayload>
    const page = parsed.page
    return parsed.kind === "page" &&
      typeof page === "number" &&
      Number.isFinite(page) &&
      page > 0
      ? Math.floor(page)
      : null
  } catch {
    return null
  }
}

export function encodeLibraryCatalogCursor(payload: Omit<LibraryCatalogCursorPayload, "kind">) {
  return Buffer.from(
    JSON.stringify({ kind: "library", ...payload } satisfies LibraryCatalogCursorPayload)
  ).toString("base64url")
}

export function decodeLibraryCatalogCursor(cursor: string | undefined | null) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<LibraryCatalogCursorPayload>

    if (
      parsed.kind !== "library" ||
      typeof parsed.id !== "string" ||
      !parsed.id ||
      typeof parsed.orderDate !== "string" ||
      !parsed.orderDate ||
      (parsed.sortBy !== "recent" &&
        parsed.sortBy !== "popular" &&
        parsed.sortBy !== "rating" &&
        parsed.sortBy !== "title" &&
        parsed.sortBy !== "relevance")
    ) {
      return null
    }

    return {
      kind: "library" as const,
      sortBy: parsed.sortBy,
      id: parsed.id,
      orderDate: parsed.orderDate,
      readsCount: typeof parsed.readsCount === "number" ? parsed.readsCount : undefined,
      bookmarksCount:
        typeof parsed.bookmarksCount === "number" ? parsed.bookmarksCount : undefined,
      ratingsCount: typeof parsed.ratingsCount === "number" ? parsed.ratingsCount : undefined,
      rating: typeof parsed.rating === "number" ? parsed.rating : undefined,
      title: typeof parsed.title === "string" ? parsed.title : undefined,
    }
  } catch {
    return null
  }
}

export function encodeSearchNovelCursor(payload: Omit<SearchNovelCursorPayload, "kind">) {
  return Buffer.from(
    JSON.stringify({ kind: "search-novel", ...payload } satisfies SearchNovelCursorPayload)
  ).toString("base64url")
}

export function decodeSearchNovelCursor(cursor: string | undefined | null) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<SearchNovelCursorPayload>

    if (
      parsed.kind !== "search-novel" ||
      typeof parsed.id !== "string" ||
      !parsed.id ||
      typeof parsed.orderDate !== "string" ||
      !parsed.orderDate ||
      (parsed.sortBy !== "relevance" &&
        parsed.sortBy !== "popular" &&
        parsed.sortBy !== "recent")
    ) {
      return null
    }

    return {
      kind: "search-novel" as const,
      sortBy: parsed.sortBy,
      id: parsed.id,
      readsCount: typeof parsed.readsCount === "number" ? parsed.readsCount : 0,
      bookmarksCount: typeof parsed.bookmarksCount === "number" ? parsed.bookmarksCount : 0,
      ratingsCount: typeof parsed.ratingsCount === "number" ? parsed.ratingsCount : 0,
      orderDate: parsed.orderDate,
      rankScore: typeof parsed.rankScore === "number" ? parsed.rankScore : undefined,
      similarityScore:
        typeof parsed.similarityScore === "number" ? parsed.similarityScore : undefined,
    }
  } catch {
    return null
  }
}

export function encodeSearchAuthorCursor(payload: Omit<SearchAuthorCursorPayload, "kind">) {
  return Buffer.from(
    JSON.stringify({ kind: "search-author", ...payload } satisfies SearchAuthorCursorPayload)
  ).toString("base64url")
}

export function decodeSearchAuthorCursor(cursor: string | undefined | null) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8")
    ) as Partial<SearchAuthorCursorPayload>

    if (
      parsed.kind !== "search-author" ||
      typeof parsed.id !== "string" ||
      !parsed.id ||
      typeof parsed.updatedAt !== "string" ||
      !parsed.updatedAt ||
      (parsed.sortBy !== "relevance" &&
        parsed.sortBy !== "popular" &&
        parsed.sortBy !== "recent")
    ) {
      return null
    }

    return {
      kind: "search-author" as const,
      sortBy: parsed.sortBy,
      id: parsed.id,
      followersCount:
        typeof parsed.followersCount === "number" ? parsed.followersCount : 0,
      novelsCount: typeof parsed.novelsCount === "number" ? parsed.novelsCount : 0,
      updatedAt: parsed.updatedAt,
      rankScore: typeof parsed.rankScore === "number" ? parsed.rankScore : undefined,
      similarityScore:
        typeof parsed.similarityScore === "number" ? parsed.similarityScore : undefined,
    }
  } catch {
    return null
  }
}
