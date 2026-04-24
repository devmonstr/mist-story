"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crown,
  Flame,
  Grid2X2,
  Heart,
  Search,
  Sparkles,
  Star,
  Sword,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type HomeHeroNovelView = {
  id: string
  title: string
  href: string
  authorName: string
  summary: string
  coverSrc: string | null
  genre: string | null
  status: string | null
  chaptersCount: number
  rating: number
}

export type HomeHeroRankingKey = "novels" | "translations" | "newVoices"

export type HomeHeroGenreIcon =
  | "sparkles"
  | "sword"
  | "heart"
  | "search"
  | "flame"
  | "grid"

export type HomeHeroGenreShortcutView = {
  label: string
  href: string
  icon: HomeHeroGenreIcon
}

export type HomeHeroClientProps = {
  featuredNovels: HomeHeroNovelView[]
  rankings: Record<HomeHeroRankingKey, HomeHeroNovelView[]>
  genreShortcuts: HomeHeroGenreShortcutView[]
  discoverHref?: string
  libraryHref?: string
  rankingHrefs?: Record<HomeHeroRankingKey, string>
}

const rankingTabs: Array<{ key: HomeHeroRankingKey; label: string }> = [
  { key: "novels", label: "Novels" },
  { key: "translations", label: "Translations" },
  { key: "newVoices", label: "New Voices" },
]

const genreIcons = {
  sparkles: Sparkles,
  sword: Sword,
  heart: Heart,
  search: Search,
  flame: Flame,
  grid: Grid2X2,
} satisfies Record<HomeHeroGenreIcon, typeof Sparkles>

function formatRating(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "New"
}

function formatNovelMeta(novel: HomeHeroNovelView) {
  return [novel.genre, novel.status].filter(Boolean).join(" / ")
}

function clampFeaturedIndex(index: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return ((index % total) + total) % total
}

function RankingCover({
  rank,
  novel,
}: {
  rank: number
  novel: HomeHeroNovelView
}) {
  return (
    <div className="relative h-16 w-12 shrink-0 overflow-hidden border border-border bg-secondary">
      {novel.coverSrc ? (
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${JSON.stringify(novel.coverSrc)})`,
          }}
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--muted)),hsl(var(--background)))]" />
          <div className="absolute inset-x-2 bottom-2 top-3 border border-border/70 bg-background/70" />
          <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 bg-primary/10" />
        </>
      )}
      <span className="absolute bottom-1 right-1 font-serif text-xs text-muted-foreground">
        {rank}
      </span>
    </div>
  )
}

export function HomeHeroClient({
  featuredNovels,
  rankings,
  genreShortcuts,
  discoverHref = "/discover",
  libraryHref = "/library",
  rankingHrefs = {
    novels: "/library?sort=rating",
    translations: "/library?sort=rating&workType=TRANSLATION",
    newVoices: "/library?collection=new-voices&sort=recent",
  },
}: HomeHeroClientProps) {
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [activeRanking, setActiveRanking] =
    useState<HomeHeroRankingKey>("novels")

  const featured =
    featuredNovels[clampFeaturedIndex(featuredIndex, featuredNovels.length)] ??
    null
  const activeRankings = rankings[activeRanking] ?? []
  const hasFeaturedCarousel = featuredNovels.length > 1

  function showPreviousFeatured() {
    setFeaturedIndex((currentIndex) =>
      clampFeaturedIndex(currentIndex - 1, featuredNovels.length),
    )
  }

  function showNextFeatured() {
    setFeaturedIndex((currentIndex) =>
      clampFeaturedIndex(currentIndex + 1, featuredNovels.length),
    )
  }

  return (
    <section className="w-full border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:px-8">
        <div className="space-y-4">
          <article className="group relative min-h-[22rem] overflow-hidden border border-border bg-card shadow-none sm:min-h-[26rem]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 78% 16%, hsl(var(--primary) / 0.16), transparent 30%), linear-gradient(110deg, hsl(var(--background)) 0%, hsl(var(--card)) 48%, hsl(var(--secondary)) 100%)",
                backgroundPosition: "center",
                backgroundSize: "cover",
              }}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden md:block">
              <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full border border-primary/20 bg-primary/5 blur-sm transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute right-20 top-8 h-48 w-48 rounded-full border border-border bg-background/50" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent" />
              {featured?.coverSrc ? (
                <>
                  <div className="absolute right-6 top-1/2 z-0 h-[72%] max-h-[20rem] w-[min(13rem,32vw)] -translate-y-[46%] border border-border/50 bg-muted/40" />
                  <div className="absolute right-10 top-1/2 z-10 h-[82%] max-h-[23rem] w-[min(15rem,38vw)] -translate-y-1/2 translate-x-2 border border-border bg-background shadow-[0_30px_80px_hsl(var(--foreground)/0.16)] transition-transform duration-700 group-hover:-translate-y-[51%] group-hover:translate-x-0">
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${JSON.stringify(featured.coverSrc)})`,
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 w-5 bg-gradient-to-r from-background/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/30 to-transparent" />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute bottom-0 right-8 h-72 w-28 skew-x-[-10deg] border border-border/70 bg-background/50" />
                  <div className="absolute bottom-0 right-32 h-60 w-24 skew-x-[-12deg] border border-border/70 bg-card/60" />
                  <div className="absolute bottom-0 right-56 h-48 w-20 skew-x-[-8deg] border border-border/70 bg-secondary/70" />
                </>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/25" />

            <button
              type="button"
              className="absolute left-3 top-1/2 z-30 hidden size-9 -translate-y-1/2 items-center justify-center border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:flex lg:left-4"
              aria-label="Previous featured story"
              disabled={!hasFeaturedCarousel}
              onClick={showPreviousFeatured}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="absolute right-3 top-1/2 z-30 hidden size-9 -translate-y-1/2 items-center justify-center border border-border bg-background/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 sm:flex lg:right-4"
              aria-label="Next featured story"
              disabled={!hasFeaturedCarousel}
              onClick={showNextFeatured}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="relative z-10 flex min-h-[22rem] max-w-xl flex-col justify-end px-6 py-7 sm:min-h-[26rem] sm:px-16 sm:py-10">
              <div className="inline-flex w-fit items-center border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.24em] text-foreground">
                Feature Story
              </div>
              <h1 className="mt-5 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {featured?.title ?? "No featured story yet"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {featured
                  ? `by ${featured.authorName}`
                  : "Publish a story to feature it here."}
              </p>
              <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
                {featured?.summary ||
                  "Once published novels are available, the homepage will highlight a real story from the catalog."}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                {featured ? (
                  <>
                    {featured.genre ? (
                      <span className="border border-border bg-background/80 px-2.5 py-1 text-muted-foreground">
                        {featured.genre}
                      </span>
                    ) : null}
                    <span className="border border-border bg-background/80 px-2.5 py-1 text-muted-foreground">
                      {featured.chaptersCount.toLocaleString()} chapters
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-foreground">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {formatRating(featured.rating)}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-none">
                  <Link href={featured?.href ?? discoverHref}>
                    <BookOpen className="h-4 w-4" />
                    {featured ? "Start Reading" : "Explore Stories"}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-none"
                >
                  <Link href={libraryHref}>
                    Explore Library
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {hasFeaturedCarousel ? (
              <div className="absolute bottom-5 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-2 sm:flex">
                {featuredNovels.map((story, index) => (
                  <button
                    key={story.id}
                    type="button"
                    className={`h-1.5 transition-all ${
                      index === clampFeaturedIndex(featuredIndex, featuredNovels.length)
                        ? "w-8 bg-foreground"
                        : "w-1.5 rounded-full bg-muted-foreground/50 hover:bg-muted-foreground"
                    }`}
                    aria-label={`Show featured story ${index + 1}`}
                    aria-current={
                      index ===
                      clampFeaturedIndex(featuredIndex, featuredNovels.length)
                        ? "true"
                        : undefined
                    }
                    onClick={() => setFeaturedIndex(index)}
                  />
                ))}
              </div>
            ) : null}
          </article>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {genreShortcuts.map((item) => {
              const Icon = genreIcons[item.icon]

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="group flex items-center justify-center gap-2 border border-border bg-card px-3 py-4 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-secondary"
                >
                  <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <aside className="border border-border bg-card p-5 lg:min-h-[26rem]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-foreground" />
              <h2 className="font-serif text-xl text-foreground">
                Top Rankings
              </h2>
            </div>
            <Link
              href={rankingHrefs[activeRanking]}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-3 border-b border-border text-center text-xs font-medium text-muted-foreground">
            {rankingTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`pb-3 transition-colors hover:text-foreground ${
                  tab.key === activeRanking
                    ? "border-b border-foreground text-foreground"
                    : ""
                }`}
                aria-pressed={tab.key === activeRanking}
                onClick={() => setActiveRanking(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            {activeRankings.length > 0 ? (
              activeRankings.map((story, index) => (
                <Link
                  key={story.id}
                  href={story.href}
                  className="group grid grid-cols-[1.75rem_3rem_minmax(0,1fr)_auto] items-center gap-3"
                >
                  <span className="flex h-6 w-6 items-center justify-center border border-border text-sm text-muted-foreground transition-colors group-hover:border-foreground/50 group-hover:text-foreground">
                    {index + 1}
                  </span>
                  <RankingCover rank={index + 1} novel={story} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground transition-colors group-hover:text-muted-foreground">
                      {story.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted-foreground">
                      {formatNovelMeta(story)}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-foreground">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {formatRating(story.rating)}
                  </span>
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-border bg-background/50 p-4 text-sm leading-6 text-muted-foreground">
                No ranked stories yet. Published novels will appear here
                automatically.
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
