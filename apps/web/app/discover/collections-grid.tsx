"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  Bookmark,
  ChevronRight,
  Clock3,
  Compass,
  Eye,
  Flame,
  Heart,
  Layers3,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

import type { DiscoverCollection } from "./discover-data"

interface CollectionsGridProps {
  collections: DiscoverCollection[]
}

function formatCount(value: number) {
  return value.toLocaleString()
}

function formatWorkType(value: "ORIGINAL" | "TRANSLATION") {
  return value === "TRANSLATION" ? "Translation" : "Original"
}

const readingPaths = [
  {
    title: "A quick strong start",
    description: "Popular ongoing stories with active reader signals.",
    href: "/library?sort=popular&status=Ongoing",
    icon: Flame,
  },
  {
    title: "A finished binge",
    description: "Completed stories for when you want a clean runway.",
    href: "/library?sort=popular&status=Completed",
    icon: Clock3,
  },
  {
    title: "Fresh writers",
    description: "New voices with recently published work.",
    href: "/library?collection=new-voices",
    icon: WandSparkles,
  },
  {
    title: "Original worlds",
    description: "Stories built first for Myth Story readers.",
    href: "/library?workType=ORIGINAL&sort=popular",
    icon: Compass,
  },
]

const moodShortcuts = [
  { label: "Epic worlds", href: "/library?genre=fantasy&sort=popular" },
  { label: "Soft romance", href: "/library?genre=romance&sort=popular" },
  { label: "Light comedy", href: "/library?genre=comedy&sort=popular" },
  { label: "Mystery hooks", href: "/library?genre=mystery&sort=popular" },
  { label: "Slow life", href: "/library?genre=slice-of-life&sort=popular" },
  { label: "Sci-fi ideas", href: "/library?genre=sci-fi&sort=popular" },
  { label: "Cultivation climb", href: "/library?genre=cultivation&sort=popular" },
  { label: "Emotional drama", href: "/library?genre=drama&sort=popular" },
]

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Reader signals
            </p>
            <h2 className="font-serif text-2xl font-light text-foreground sm:text-3xl">
              Curated collections
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Move from a broad mood into a focused shelf with a lead pick and more covers nearby.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/library?sort=popular">
              Browse popular stories
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {collections.map((collection) => {
            const leadNovel = collection.previewNovels[0]
            const leadCoverSrc = leadNovel
              ? resolveNovelCoverSrc({
                  novelId: leadNovel.id,
                  coverUrl: leadNovel.coverUrl,
                  coverStorageKey: leadNovel.coverStorageKey,
                })
              : null

            return (
              <article
                key={collection.id}
                className="flex min-h-[440px] flex-col justify-between border border-border/40 bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm sm:p-7"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-xl font-medium text-foreground">
                        {collection.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {collection.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full border border-border/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      {formatCount(collection.storyCount)}
                    </span>
                  </div>

                  {leadNovel ? (
                    <Link
                      href={`/novel/${leadNovel.slug}`}
                      className="group mt-5 grid gap-4 border-t border-border/30 pt-5 sm:grid-cols-[116px_minmax(0,1fr)]"
                    >
                      <div className="overflow-hidden border border-border/40 bg-muted/20">
                        {leadCoverSrc ? (
                          <Image
                            src={leadCoverSrc}
                            alt={`${leadNovel.title} cover`}
                            width={240}
                            height={320}
                            sizes="116px"
                            className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex aspect-[3/4] w-full items-center justify-center text-muted-foreground">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {leadNovel.genre}
                          </span>
                          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            {formatWorkType(leadNovel.workType)}
                          </span>
                        </div>
                        <h4 className="mt-3 line-clamp-2 text-base font-semibold text-foreground">
                          {leadNovel.title}
                        </h4>
                        <p className="mt-1 text-xs text-muted-foreground">
                          by {leadNovel.authorName}
                        </p>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {leadNovel.summary}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {formatCount(leadNovel.readsCount)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Bookmark className="h-3.5 w-3.5" />
                            {formatCount(leadNovel.bookmarksCount)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5" />
                            {leadNovel.rating.toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Layers3 className="h-3.5 w-3.5" />
                            {formatCount(leadNovel.chaptersCount)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ) : null}

                  {collection.previewNovels.length > 1 ? (
                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {collection.previewNovels.slice(1).map((novel) => {
                        const coverSrc = resolveNovelCoverSrc({
                          novelId: novel.id,
                          coverUrl: novel.coverUrl,
                          coverStorageKey: novel.coverStorageKey,
                        })

                        return (
                          <Link
                            key={novel.id}
                            href={`/novel/${novel.slug}`}
                            className="group overflow-hidden border border-border/40 bg-muted/20"
                            title={`${novel.title} by ${novel.authorName}`}
                          >
                            {coverSrc ? (
                              <Image
                                src={coverSrc}
                                alt={`${novel.title} cover`}
                                width={220}
                                height={300}
                                sizes="(min-width: 1024px) 9rem, (min-width: 768px) 15vw, 28vw"
                                className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex aspect-[3/4] w-full items-center justify-center text-muted-foreground">
                                <BookOpen className="h-5 w-5" />
                              </div>
                            )}
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-border/40 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium">{collection.curator}</p>
                    <p>{collection.storyCount} stories in this lane</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                    <Link href={collection.href}>
                      Explore <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-12 border-t border-border/40 pt-10 sm:mt-14 sm:pt-12">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Heart className="h-4 w-4" />
                Start by intent
              </p>
              <h3 className="font-serif text-2xl font-light text-foreground">
                When you do not know what to read
              </h3>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Pick by commitment, freshness, or momentum before choosing a specific title.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {readingPaths.map((path) => {
              const Icon = path.icon

              return (
                <Link
                  key={path.title}
                  href={path.href}
                  className="group flex min-h-[150px] flex-col justify-between border border-border/40 bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm"
                >
                  <div>
                    <div className="mb-4 flex h-9 w-9 items-center justify-center border border-border/50 bg-muted/40 text-muted-foreground transition-colors group-hover:text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">{path.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {path.description}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/20 pt-3">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Browse lane
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-8">
          <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            Mood shortcuts
          </div>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            {moodShortcuts.map((mood) => (
              <Link
                key={mood.label}
                href={mood.href}
                className="flex h-11 items-center justify-between border border-border/40 bg-background px-3 text-sm font-medium text-foreground transition-colors hover:border-border/80 hover:bg-muted/40"
              >
                {mood.label}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
