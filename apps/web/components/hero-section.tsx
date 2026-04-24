import type { LibraryCatalogNovelDto } from "@myth/shared"
import { HomeHeroClient, type HomeHeroNovelView } from "@/components/home-hero-client"
import { fetchLibraryCatalog } from "@/lib/api"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

type HomeHeroCatalog = {
  featuredNovels: HomeHeroNovelView[]
  rankings: {
    novels: HomeHeroNovelView[]
    translations: HomeHeroNovelView[]
    newVoices: HomeHeroNovelView[]
  }
}

const genreShortcuts = [
  { label: "Fantasy", href: "/library?genre=fantasy", icon: "sparkles" as const },
  { label: "Action", href: "/library?genre=action", icon: "sword" as const },
  { label: "Romance", href: "/library?genre=romance", icon: "heart" as const },
  { label: "Mystery", href: "/library?genre=mystery", icon: "search" as const },
  {
    label: "Trending",
    href: "/library?collection=trending&sort=popular",
    icon: "flame" as const,
  },
  { label: "More", href: "/discover", icon: "grid" as const },
]

function getNovelHref(novel: LibraryCatalogNovelDto) {
  return `/novel/${novel.slug || novel.id}`
}

function toHeroNovelView(novel: LibraryCatalogNovelDto): HomeHeroNovelView {
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

async function loadHomeHeroCatalog(): Promise<HomeHeroCatalog> {
  try {
    const [popularCatalog, rankingCatalog, translationCatalog, newVoicesCatalog] =
      await Promise.all([
        fetchLibraryCatalog({ sortBy: "popular", pageSize: 6 }),
        fetchLibraryCatalog({ sortBy: "rating", pageSize: 5 }),
        fetchLibraryCatalog({
          sortBy: "rating",
          workType: "TRANSLATION",
          pageSize: 5,
        }),
        fetchLibraryCatalog({
          sortBy: "recent",
          collection: "new-voices",
          pageSize: 5,
        }),
      ])

    return {
      featuredNovels: popularCatalog.novels.slice(0, 6).map(toHeroNovelView),
      rankings: {
        novels: rankingCatalog.novels.slice(0, 5).map(toHeroNovelView),
        translations: translationCatalog.novels.slice(0, 5).map(toHeroNovelView),
        newVoices: newVoicesCatalog.novels.slice(0, 5).map(toHeroNovelView),
      },
    }
  } catch (error) {
    console.error("[home] failed to load hero catalog", error)
    return {
      featuredNovels: [],
      rankings: {
        novels: [],
        translations: [],
        newVoices: [],
      },
    }
  }
}

export async function HeroSection() {
  const catalog = await loadHomeHeroCatalog()

  return (
    <HomeHeroClient
      featuredNovels={catalog.featuredNovels}
      rankings={catalog.rankings}
      genreShortcuts={genreShortcuts}
      discoverHref="/discover"
      libraryHref="/library?sort=popular"
      rankingHrefs={{
        novels: "/library?sort=rating",
        translations: "/library?sort=rating&workType=TRANSLATION",
        newVoices: "/library?collection=new-voices&sort=recent",
      }}
    />
  )
}
