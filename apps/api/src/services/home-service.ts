import {
  decimalToNumber,
  hexToNpub,
  listDiscoverCollectionsSnapshot,
  listLibraryCatalogFacetCounts,
  listLibraryCatalogNovels,
  prisma,
  toIsoString,
} from "@myth/db"
import {
  getNovelGenreDescription,
  getNovelGenreLabel,
  normalizeNovelGenreSlug,
} from "@myth/shared"
import type {
  DiscoverGenreDto,
  HomeResponse,
  HomeShelfDto,
  LibraryCatalogNovelDto,
} from "@myth/shared"
import { withPublicCache } from "./public-cache-service"

type PublicCatalogNovel = {
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
  authorDisplayName: string | null
  chaptersCount: number
  rating: Parameters<typeof decimalToNumber>[0]
  ratingsCount: number
  publishedAt: Date | null
  updatedAt: Date
  author: {
    id: string
    pubkey: string
    displayName: string | null
    handle?: string | null
    avatarUrl: string | null
  }
  _count: {
    readingProgress: number
    bookmarks: number
  }
}

function resolvePublicNovelCoverUrl(novel: {
  id: string
  coverUrl: string
  coverStorageKey: string | null
}) {
  return novel.coverStorageKey ? `/api/v1/novels/${novel.id}/cover` : novel.coverUrl
}

function resolveAuthorDisplayName(author: {
  displayName: string | null
  handle?: string | null
}) {
  return author.displayName?.trim() || author.handle?.trim() || "Unknown author"
}

function serializeNovel(novel: PublicCatalogNovel): LibraryCatalogNovelDto {
  return {
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    summary: novel.summary,
    genre: getNovelGenreLabel(novel.genre),
    workType: novel.workType,
    status: novel.status,
    visibility: novel.visibility,
    coverUrl: resolvePublicNovelCoverUrl(novel),
    coverStorageKey: null,
    author: {
      id: novel.author.id,
      npub: hexToNpub(novel.author.pubkey),
      displayName:
        resolveAuthorDisplayName(novel.author) ||
        novel.authorDisplayName ||
        "Unknown author",
      avatarUrl: novel.author.avatarUrl ?? null,
    },
    chaptersCount: novel.chaptersCount,
    readsCount: novel._count.readingProgress,
    bookmarksCount: novel._count.bookmarks,
    rating: decimalToNumber(novel.rating),
    ratingsCount: novel.ratingsCount,
    publishedAt: toIsoString(novel.publishedAt),
    updatedAt: novel.updatedAt.toISOString(),
  }
}

function buildShelf(input: {
  id: HomeShelfDto["id"]
  title: string
  description: string
  href: string
  novels: PublicCatalogNovel[]
}): HomeShelfDto {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    href: input.href,
    novels: input.novels.slice(0, 8).map(serializeNovel),
  }
}

async function countActiveWriters() {
  const rows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(DISTINCT "authorId")::int AS total
    FROM "Novel"
    WHERE "visibility" = 'PUBLISHED'
  `

  return rows[0]?.total ?? 0
}

async function getHomeDataUncached(): Promise<HomeResponse> {
  const [facetCounts, collectionsSnapshot, newReleaseNovels, activeWriters] =
    await Promise.all([
      listLibraryCatalogFacetCounts({}),
      listDiscoverCollectionsSnapshot({}),
      listLibraryCatalogNovels({}, { sortBy: "recent", pageSize: 8 }),
      countActiveWriters(),
    ])

  const genres: DiscoverGenreDto[] = facetCounts.genres.slice(0, 10).map((genre) => ({
    id:
      normalizeNovelGenreSlug(genre.genre) ??
      genre.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: getNovelGenreLabel(genre.genre),
    description: getNovelGenreDescription(genre.genre),
    storiesCount: genre._count._all,
    href: `/library?genre=${encodeURIComponent(
      normalizeNovelGenreSlug(genre.genre) ?? genre.genre
    )}&sort=popular`,
  }))

  const shelves: HomeShelfDto[] = [
    buildShelf({
      id: "trending",
      title: "Trending This Week",
      description: "Stories with the strongest recent reader momentum.",
      href: "/library?collection=trending&sort=popular",
      novels: collectionsSnapshot.trending.novels,
    }),
    buildShelf({
      id: "new-releases",
      title: "Fresh Chapters",
      description: "Recently published and updated stories ready to sample.",
      href: "/library?sort=recent",
      novels: newReleaseNovels,
    }),
    buildShelf({
      id: "hidden-gems",
      title: "Hidden Gems",
      description: "Lower-read stories with encouraging quality signals.",
      href: "/library?collection=hidden-gems&sort=popular",
      novels: collectionsSnapshot["hidden-gems"].novels,
    }),
    buildShelf({
      id: "editors-picks",
      title: "Editor's Picks",
      description: "Algorithmic picks based on rating confidence and reader saves.",
      href: "/library?collection=editors-picks&sort=rating",
      novels: collectionsSnapshot["editors-picks"].novels,
    }),
    buildShelf({
      id: "new-voices",
      title: "New Voices",
      description: "Early works from authors still building their catalog.",
      href: "/library?collection=new-voices&sort=recent",
      novels: collectionsSnapshot["new-voices"].novels,
    }),
  ]

  const featuredNovel = shelves.find((shelf) => shelf.novels.length > 0)?.novels[0] ?? null

  return {
    generatedAt: new Date().toISOString(),
    stats: {
      publishedStories: facetCounts.total,
      genresCount: facetCounts.genres.length,
      activeWriters,
    },
    hero: {
      featuredNovel,
      href: featuredNovel ? `/novel/${featuredNovel.slug}` : "/discover",
    },
    shelves,
    genres,
  }
}

export async function getHomeData(): Promise<HomeResponse> {
  return withPublicCache("home", { scope: "global" }, getHomeDataUncached)
}
