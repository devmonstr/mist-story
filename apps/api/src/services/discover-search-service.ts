import {
  countFollowersForUsers,
  countPublishedNovelsForUsers,
  decimalToNumber,
  hexToNpub,
  listDiscoverCollectionNovels,
  listDiscoverGenres,
  searchAuthors,
  searchPublishedNovels,
} from "@mist/db"
import type {
  DiscoverCollectionDto,
  DiscoverGenreDto,
  DiscoverResponse,
  SearchAuthorResultDto,
  SearchFilterType,
  SearchNovelResultDto,
  SearchResponse,
  SearchResultItemDto,
  SearchSortBy,
} from "@mist/shared"

const GENRE_DESCRIPTIONS: Record<string, string> = {
  Fantasy: "Epic adventures, magic, and otherworldly realms.",
  Romance: "Love stories that touch the heart and inspire.",
  "Mystery & Thriller": "Suspenseful tales that keep you guessing until the end.",
  Mystery: "Suspenseful tales that keep you guessing until the end.",
  Thriller: "Suspenseful tales that keep you guessing until the end.",
  "Science Fiction": "Futuristic worlds and imaginative technology.",
  "Historical Fiction": "Stories set in fascinating periods of history.",
  "Literary Fiction": "Thoughtful narratives exploring the human condition.",
}

function buildGenreDescription(genre: string) {
  return GENRE_DESCRIPTIONS[genre] ?? "Discover stories and voices in this genre."
}

function normalizeAuthorName(input: {
  displayName: string | null
  handle?: string | null
}) {
  return input.displayName?.trim() || input.handle?.trim() || "Unknown author"
}

function scoreTextMatch(query: string, value: string) {
  const normalizedQuery = query.toLowerCase()
  const normalizedValue = value.toLowerCase()

  if (normalizedValue === normalizedQuery) {
    return 120
  }
  if (normalizedValue.startsWith(normalizedQuery)) {
    return 80
  }
  if (normalizedValue.includes(normalizedQuery)) {
    return 40
  }
  return 0
}

export async function getDiscoverData(): Promise<DiscoverResponse> {
  const [genres, novels] = await Promise.all([
    listDiscoverGenres(),
    listDiscoverCollectionNovels(),
  ])

  const publishedNovelCounts = await countPublishedNovelsForUsers(
    novels.map((novel) => novel.authorId)
  )

  const trending = [...novels]
    .sort((a, b) => b._count.readingProgress - a._count.readingProgress)
    .slice(0, 12)

  const hiddenGems = [...novels]
    .filter((novel) => novel._count.readingProgress <= 25)
    .sort((a, b) => {
      if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
        return decimalToNumber(b.rating) - decimalToNumber(a.rating)
      }

      return b._count.bookmarks - a._count.bookmarks
    })
    .slice(0, 12)

  const editorsPicks = [...novels]
    .sort((a, b) => {
      if (decimalToNumber(b.rating) !== decimalToNumber(a.rating)) {
        return decimalToNumber(b.rating) - decimalToNumber(a.rating)
      }
      if (b.ratingsCount !== a.ratingsCount) {
        return b.ratingsCount - a.ratingsCount
      }
      return b._count.readingProgress - a._count.readingProgress
    })
    .slice(0, 12)

  const newVoices = [...novels]
    .filter((novel) => (publishedNovelCounts.get(novel.authorId) ?? 0) <= 1)
    .sort((a, b) => {
      const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
      const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
      return right - left
    })
    .slice(0, 12)

  const discoverGenres: DiscoverGenreDto[] = genres.map((genre) => ({
    id: genre.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title: genre.genre,
    description: buildGenreDescription(genre.genre),
    storiesCount: genre._count._all,
    href: `/search?q=${encodeURIComponent(genre.genre)}&type=novel`,
  }))

  const collections: DiscoverCollectionDto[] = [
    {
      id: "trending",
      title: "Trending This Week",
      description: "The most-read stories gaining popularity right now.",
      storyCount: trending.length,
      curator: "Mist Story Editors",
      href: "/search?type=novel&sort=popular",
    },
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      description: "Underrated stories that deserve more attention.",
      storyCount: hiddenGems.length,
      curator: "Community",
      href: "/search?type=novel&sort=popular",
    },
    {
      id: "editors-picks",
      title: "Editor's Picks",
      description: "Our favorite stories showcasing exceptional writing.",
      storyCount: editorsPicks.length,
      curator: "Mist Story Team",
      href: "/search?type=novel&sort=popular",
    },
    {
      id: "new-voices",
      title: "New Voices",
      description: "First stories from fresh and exciting writers.",
      storyCount: newVoices.length,
      curator: "Community",
      href: "/search?type=novel&sort=recent",
    },
  ]

  return {
    genres: discoverGenres,
    collections,
  }
}

function sortNovelResults(
  novels: SearchNovelResultDto[],
  query: string,
  sortBy: SearchSortBy
) {
  const normalizedQuery = query.trim().toLowerCase()

  return [...novels].sort((a, b) => {
    if (sortBy === "popular") {
      return b.readsCount - a.readsCount
    }

    if (sortBy === "recent") {
      return 0
    }

    const scoreA =
      scoreTextMatch(normalizedQuery, a.title) * 3 +
      scoreTextMatch(normalizedQuery, a.authorName) * 2 +
      scoreTextMatch(normalizedQuery, a.summary) +
      scoreTextMatch(normalizedQuery, a.genre)
    const scoreB =
      scoreTextMatch(normalizedQuery, b.title) * 3 +
      scoreTextMatch(normalizedQuery, b.authorName) * 2 +
      scoreTextMatch(normalizedQuery, b.summary) +
      scoreTextMatch(normalizedQuery, b.genre)

    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }

    return b.readsCount - a.readsCount
  })
}

function sortAuthorResults(
  authors: SearchAuthorResultDto[],
  query: string,
  sortBy: SearchSortBy
) {
  const normalizedQuery = query.trim().toLowerCase()

  return [...authors].sort((a, b) => {
    if (sortBy === "popular" || sortBy === "recent") {
      return b.followersCount - a.followersCount
    }

    const scoreA =
      scoreTextMatch(normalizedQuery, a.name) * 3 + scoreTextMatch(normalizedQuery, a.bio)
    const scoreB =
      scoreTextMatch(normalizedQuery, b.name) * 3 + scoreTextMatch(normalizedQuery, b.bio)

    if (scoreB !== scoreA) {
      return scoreB - scoreA
    }

    return b.followersCount - a.followersCount
  })
}

export async function searchCatalog(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
}): Promise<SearchResponse> {
  const query = input.query.trim()
  const filterType = input.filterType
  const sortBy = input.sortBy

  if (!query) {
    return {
      query,
      filterType,
      sortBy,
      total: 0,
      items: [],
    }
  }

  const shouldLoadNovels = filterType === "all" || filterType === "novel"
  const shouldLoadAuthors = filterType === "all" || filterType === "author"

  const [novels, authors] = await Promise.all([
    shouldLoadNovels ? searchPublishedNovels(query) : Promise.resolve([]),
    shouldLoadAuthors ? searchAuthors(query) : Promise.resolve([]),
  ])

  const authorFollowerCounts = await countFollowersForUsers(authors.map((author) => author.id))
  const authorNovelCounts = await countPublishedNovelsForUsers(authors.map((author) => author.id))

  const novelResults: SearchNovelResultDto[] = sortNovelResults(
    novels.map((novel) => ({
      id: novel.id,
      type: "novel",
      slug: novel.slug,
      title: novel.title,
      authorName: normalizeAuthorName(novel.author),
      authorNpub: hexToNpub(novel.author.pubkey),
      genre: novel.genre,
      summary: novel.summary,
      readsCount: novel._count.readingProgress,
      chaptersCount: novel.chaptersCount,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey,
    })),
    query,
    sortBy
  )

  const authorResults: SearchAuthorResultDto[] = sortAuthorResults(
    authors.map((author) => ({
      id: author.id,
      type: "author",
      npub: hexToNpub(author.pubkey),
      name: normalizeAuthorName(author),
      bio: author.about ?? "",
      followersCount: authorFollowerCounts.get(author.id) ?? 0,
      novelsCount: authorNovelCounts.get(author.id) ?? 0,
      avatarUrl: author.avatarUrl ?? null,
    })),
    query,
    sortBy
  )

  let items: SearchResultItemDto[] = []

  if (filterType === "novel") {
    items = novelResults
  } else if (filterType === "author") {
    items = authorResults
  } else {
    items = [...novelResults, ...authorResults].sort((a, b) => {
      if (sortBy === "popular") {
        const aScore = a.type === "novel" ? a.readsCount : a.followersCount
        const bScore = b.type === "novel" ? b.readsCount : b.followersCount
        return bScore - aScore
      }

      if (a.type !== b.type) {
        return a.type === "novel" ? -1 : 1
      }

      return 0
    })
  }

  return {
    query,
    filterType,
    sortBy,
    total: items.length,
    items,
  }
}
