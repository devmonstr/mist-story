import {
  HomeHeroClient,
  type HomeHeroNovelView,
  type HomeHeroRankingShelfView,
} from "@/components/home-hero-client"
import type { HomeGenreDto, HomeNovelDto, HomeShelfDto } from "@/lib/api"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

const genreShortcutIcons = ["sparkles", "sword", "heart", "search"] as const

type HeroSectionProps = {
  featuredNovel: HomeNovelDto | null
  rankingShelves: HomeShelfDto[]
  genres: HomeGenreDto[]
}

function getNovelHref(novel: Pick<HomeNovelDto, "id" | "slug">) {
  return `/novel/${novel.slug || novel.id}`
}

function toHeroNovelView(novel: HomeNovelDto): HomeHeroNovelView {
  return {
    id: novel.id,
    title: novel.title,
    href: getNovelHref(novel),
    authorName: novel.author.displayName || "Unknown writer",
    summary: novel.summary,
    coverSrc: resolveNovelCoverSrc({
      novelId: novel.id,
      coverUrl: novel.coverUrl,
      coverStorageKey: novel.coverStorageKey,
    }),
    genre: novel.genre || null,
    status: novel.status || null,
    chaptersCount: novel.chaptersCount,
    rating: novel.rating,
  }
}

function toGenreShortcuts(genres: HomeGenreDto[]) {
  return [
    ...genres.slice(0, 4).map((genre, index) => ({
      label: genre.title,
      href: genre.href,
      icon: genreShortcutIcons[index % genreShortcutIcons.length],
    })),
    {
      label: "Trending",
      href: "/library?collection=trending&sort=popular",
      icon: "flame" as const,
    },
    { label: "More", href: "/discover", icon: "grid" as const },
  ]
}

function toRankingShelves(shelves: HomeShelfDto[]): HomeHeroRankingShelfView[] {
  return shelves.slice(0, 3).map((shelf) => ({
    id: shelf.id,
    label: shelf.title,
    href: shelf.href,
    description: shelf.description,
    novels: shelf.novels.slice(0, 5).map(toHeroNovelView),
  }))
}

export function HeroSection({
  featuredNovel,
  rankingShelves,
  genres,
}: HeroSectionProps) {
  const featuredNovels = featuredNovel ? [toHeroNovelView(featuredNovel)] : []

  return (
    <HomeHeroClient
      featuredNovels={featuredNovels}
      rankingShelves={toRankingShelves(rankingShelves)}
      genreShortcuts={toGenreShortcuts(genres)}
      discoverHref="/discover"
      libraryHref="/library?sort=popular"
    />
  )
}
