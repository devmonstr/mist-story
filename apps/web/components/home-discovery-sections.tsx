import Link from "next/link"
import { Clock3, Compass, LibraryBig, PenSquare, Shapes } from "lucide-react"
import {
  pageContentContainerClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { HomeDiscoveryShelf } from "@/components/home-discovery-shelf"
import type { HomeGenreDto, HomeShelfDto, HomeStatsDto } from "@/lib/api"

type HomeDiscoverySectionsProps = {
  generatedAt: string | null
  stats: HomeStatsDto | null
  shelves: HomeShelfDto[]
  genres: HomeGenreDto[]
}

function formatGeneratedAt(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export function HomeDiscoverySections({
  generatedAt,
  stats,
  shelves,
  genres,
}: HomeDiscoverySectionsProps) {
  const updatedAt = formatGeneratedAt(generatedAt)
  const statCards = stats
    ? [
        {
          label: "Published Stories",
          value: stats.publishedStories.toLocaleString(),
          icon: LibraryBig,
        },
        {
          label: "Active Writers",
          value: stats.activeWriters.toLocaleString(),
          icon: PenSquare,
        },
        {
          label: "Live Genres",
          value: stats.genresCount.toLocaleString(),
          icon: Shapes,
        },
      ]
    : []

  return (
    <>
      <section className={`border-b border-border/60 bg-card/30 ${pageSectionPaddingClassName}`}>
        <div className={pageContentContainerClassName}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Compass className="h-4 w-4" />
                Reader Discovery
              </div>
              <h2 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl">
                Rankings, fresh releases, and quieter stories worth catching early.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                Home now pulls from a single analytics payload so discovery shelves stay aligned
                with the hero and update together.
              </p>
            </div>

            {updatedAt ? (
              <div className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                <Clock3 className="h-4 w-4" />
                Updated {updatedAt}
              </div>
            ) : null}
          </div>

          {statCards.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {statCards.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.label} className="border border-border bg-background p-4">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </div>
                    <p className="mt-3 font-serif text-3xl text-foreground">{item.value}</p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className={pageSectionPaddingClassName}>
        <div className={pageContentContainerClassName}>
          {shelves.length > 0 ? (
            shelves.map((shelf, index) => (
              <HomeDiscoveryShelf
                key={shelf.id}
                shelf={shelf}
                className={index === 0 ? "border-t-0 pt-0" : undefined}
              />
            ))
          ) : (
            <div className="border border-dashed border-border bg-card/50 p-6 text-sm leading-6 text-muted-foreground">
              Discovery shelves are temporarily unavailable. The homepage will fill in
              automatically when `/api/v1/home` starts returning ranked results.
            </div>
          )}
        </div>
      </section>

      {genres.length > 0 ? (
        <section className="border-t border-border/60 py-10 sm:py-12">
          <div className={pageContentContainerClassName}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-2xl text-foreground">Browse By Genre</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Jump into the strongest active categories without leaving the homepage.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {genres.map((genre) => (
                <Link
                  key={genre.id}
                  href={genre.href}
                  className="group border border-border bg-card px-4 py-3 transition-colors hover:border-foreground/40 hover:bg-secondary"
                >
                  <span className="block text-sm font-medium text-foreground">{genre.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {genre.storiesCount.toLocaleString()} stories
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
