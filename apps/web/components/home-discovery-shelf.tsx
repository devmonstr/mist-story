import Link from "next/link"
import { ArrowRight, BookMarked, Bookmark, Eye, Star } from "lucide-react"
import { NovelCard } from "@/components/novel/novel-card"
import { Button } from "@/components/ui/button"
import type { HomeNovelDto, HomeShelfDto } from "@/lib/api"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { cn } from "@/lib/utils"

type HomeDiscoveryShelfProps = {
  shelf: HomeShelfDto
  className?: string
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  )
}

function formatRating(rating: number) {
  return rating > 0 ? rating.toFixed(1) : "New"
}

function getNovelHref(novel: Pick<HomeNovelDto, "id" | "slug">) {
  return `/novel/${novel.slug || novel.id}`
}

function renderMeta(novel: HomeNovelDto) {
  const meta = [novel.genre, novel.status].filter(Boolean).join(" / ")

  return (
    <div className="space-y-3">
      {meta ? <p>{meta}</p> : null}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <BookMarked className="h-3.5 w-3.5" />
          {novel.chaptersCount.toLocaleString()} chapters
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {formatCompactNumber(novel.readsCount)} reads
        </span>
        <span className="inline-flex items-center gap-1">
          <Bookmark className="h-3.5 w-3.5" />
          {formatCompactNumber(novel.bookmarksCount)} saves
        </span>
      </div>
    </div>
  )
}

export function HomeDiscoveryShelf({ shelf, className }: HomeDiscoveryShelfProps) {
  return (
    <section className={cn("border-t border-border/60 py-10 sm:py-12", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-serif text-2xl text-foreground sm:text-3xl">{shelf.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {shelf.description}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full rounded-none sm:w-auto">
          <Link href={shelf.href}>
            View shelf
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {shelf.novels.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shelf.novels.map((novel) => (
            <NovelCard
              key={novel.id}
              href={getNovelHref(novel)}
              title={novel.title}
              coverSrc={resolveNovelCoverSrc({
                novelId: novel.id,
                coverUrl: novel.coverUrl,
                coverStorageKey: novel.coverStorageKey,
              })}
              authorName={novel.author.displayName || "Unknown writer"}
              summary={novel.summary}
              meta={renderMeta(novel)}
              titleAside={
                <span className="inline-flex items-center gap-1 border border-border bg-background px-2 py-1 text-xs text-foreground">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  {formatRating(novel.rating)}
                </span>
              }
              footer={
                <Button asChild variant="ghost" className="mt-2 justify-between rounded-none px-0">
                  <Link href={getNovelHref(novel)}>
                    Read story
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              }
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 border border-dashed border-border bg-card/50 p-5 text-sm leading-6 text-muted-foreground">
          This shelf is still loading reader signals. Published stories will appear here
          automatically.
        </div>
      )}
    </section>
  )
}
