import Link from "next/link"
import { getNovelGenreLabel } from "@myth/shared"
import type { DiscoverResponse } from "@myth/shared"
import {
  BookOpenText,
  Layers3,
  LibraryBig,
  Search,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react"
import {
  pageContentContainerClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ReactNode } from "react"

interface DiscoverShellProps {
  children: ReactNode
  activeFilters?: DiscoverResponse["activeFilters"]
  facets?: DiscoverResponse["facets"]
}

function formatCollectionLabel(value: string) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatCount(value: number | undefined) {
  return (value ?? 0).toLocaleString()
}

function buildDiscoverHref(input: {
  query?: string
  genre?: string | null
  workType?: string | null
  status?: string | null
  collection?: string | null
  sort?: string | null
}) {
  const params = new URLSearchParams()

  if (input.query?.trim()) {
    params.set("q", input.query.trim())
  }
  if (input.genre?.trim()) {
    params.set("genre", input.genre.trim())
  }
  if (input.workType && input.workType !== "all") {
    params.set("workType", input.workType)
  }
  if (input.status && input.status !== "all") {
    params.set("status", input.status)
  }
  if (input.collection && input.collection !== "all") {
    params.set("collection", input.collection)
  }
  if (input.sort && input.sort !== "recent") {
    params.set("sort", input.sort)
  }

  const queryString = params.toString()
  return queryString ? `/discover?${queryString}` : "/discover"
}

function buildLibraryHref(activeFilters?: DiscoverResponse["activeFilters"]) {
  const params = new URLSearchParams()

  if (activeFilters?.q?.trim()) {
    params.set("q", activeFilters.q.trim())
  }
  if (activeFilters?.genre?.trim()) {
    params.set("genre", activeFilters.genre.trim())
  }
  if (activeFilters?.workType && activeFilters.workType !== "all") {
    params.set("workType", activeFilters.workType)
  }
  if (activeFilters?.status && activeFilters.status !== "all") {
    params.set("status", activeFilters.status)
  }
  if (activeFilters?.collection && activeFilters.collection !== "all") {
    params.set("collection", activeFilters.collection)
  }
  if (activeFilters?.sort && activeFilters.sort !== "recent") {
    params.set("sort", activeFilters.sort)
  }

  const queryString = params.toString()
  return queryString ? `/library?${queryString}` : "/library"
}

export function DiscoverShell({ children, activeFilters, facets }: DiscoverShellProps) {
  const hasActiveFilters =
    Boolean(activeFilters?.q?.trim()) ||
    Boolean(activeFilters?.genre?.trim()) ||
    (activeFilters?.workType && activeFilters.workType !== "all") ||
    (activeFilters?.status && activeFilters.status !== "all") ||
    (activeFilters?.collection && activeFilters.collection !== "all")
  const browseHref = buildLibraryHref(activeFilters)
  const topGenre = facets?.genres[0]
  const originalCount = facets?.workTypes.find((item) => item.value === "ORIGINAL")?.count
  const completedCount = facets?.statuses.find((item) => item.value === "Completed")?.count
  const quickCollections = [
    {
      label: "Trending",
      href: buildDiscoverHref({ collection: "trending", sort: "popular" }),
      icon: TrendingUp,
    },
    {
      label: "Hidden Gems",
      href: buildDiscoverHref({ collection: "hidden-gems", sort: "popular" }),
      icon: Sparkles,
    },
    {
      label: "New Voices",
      href: buildDiscoverHref({ collection: "new-voices" }),
      icon: Layers3,
    },
    {
      label: "Completed",
      href: buildDiscoverHref({ status: "Completed", sort: "popular" }),
      icon: BookOpenText,
    },
  ]

  return (
    <>
      <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
        <div className={pageContentContainerClassName}>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <LibraryBig className="h-4 w-4" />
                Myth Story Discover
              </div>
              <h1 className="max-w-4xl font-serif text-3xl font-light text-foreground sm:text-5xl">
                Find the next world worth staying in.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-8">
                Search across published stories, scan active genres, and jump into curated
                collections shaped by reader activity.
              </p>

              <form action="/discover" className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row">
                {activeFilters?.genre?.trim() ? (
                  <input type="hidden" name="genre" value={activeFilters.genre} />
                ) : null}
                {activeFilters?.workType && activeFilters.workType !== "all" ? (
                  <input type="hidden" name="workType" value={activeFilters.workType} />
                ) : null}
                {activeFilters?.status && activeFilters.status !== "all" ? (
                  <input type="hidden" name="status" value={activeFilters.status} />
                ) : null}
                {activeFilters?.collection && activeFilters.collection !== "all" ? (
                  <input type="hidden" name="collection" value={activeFilters.collection} />
                ) : null}
                {activeFilters?.sort && activeFilters.sort !== "recent" ? (
                  <input type="hidden" name="sort" value={activeFilters.sort} />
                ) : null}
                <div className="relative min-w-0 flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="q"
                    defaultValue={activeFilters?.q ?? ""}
                    placeholder="Search stories, authors, genres..."
                    className="h-11 pl-10"
                  />
                </div>
                <Button type="submit" className="h-11 sm:w-32">
                  Search
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickCollections.map((item) => {
                  const Icon = item.icon

                  return (
                    <Button key={item.label} variant="outline" size="sm" asChild>
                      <Link href={item.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border border-border/50 bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Published Stories</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatCount(facets?.total)}
                </p>
              </div>
              <div className="border border-border/50 bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Top Genre</p>
                <p className="mt-2 truncate text-2xl font-semibold text-foreground">
                  {topGenre ? topGenre.label : "None"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCount(topGenre?.count)} stories
                </p>
              </div>
              <div className="border border-border/50 bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Original Works</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatCount(originalCount)}
                </p>
              </div>
              <div className="border border-border/50 bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground">Completed</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {formatCount(completedCount)}
                </p>
              </div>
            </div>
          </div>

          {hasActiveFilters ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {activeFilters?.q?.trim() ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  Search: {activeFilters.q.trim()}
                </span>
              ) : null}
              {activeFilters?.genre?.trim() ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  Genre: {getNovelGenreLabel(activeFilters.genre)}
                </span>
              ) : null}
              {activeFilters?.workType && activeFilters.workType !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {activeFilters.workType === "TRANSLATION" ? "Translation" : "Original"}
                </span>
              ) : null}
              {activeFilters?.status && activeFilters.status !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {activeFilters.status}
                </span>
              ) : null}
              {activeFilters?.collection && activeFilters.collection !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {formatCollectionLabel(activeFilters.collection)}
                </span>
              ) : null}
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={browseHref}>Browse in library</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-8">
                <Link href="/discover">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {children}
    </>
  )
}
