"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, RefreshCcw } from "lucide-react"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { useLibraryCatalogContext } from "./library-catalog-context"
import { loadLibraryCatalog, type LibraryCatalogNovel } from "./library-catalog"
import { StoriesGridSkeleton } from "./stories-grid-skeleton"

function formatWorkType(value: LibraryCatalogNovel["workType"]) {
  return value === "TRANSLATION" ? "Translation" : "Original"
}

function formatStoryDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function StoriesGrid() {
  const { deferredQuery, query, clearQuery } = useLibraryCatalogContext()
  const [stories, setStories] = useState<LibraryCatalogNovel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<"popular" | "recent">("popular")

  useEffect(() => {
    let isActive = true

    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)

      void loadLibraryCatalog(deferredQuery)
        .then((payload) => {
          if (!isActive) {
            return
          }

          setStories(payload.novels)
        })
        .catch((loadError) => {
          if (!isActive) {
            return
          }

          setStories([])
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load the library catalog."
          )
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false)
          }
        })
    }, 220)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [deferredQuery])

  const sortedStories = useMemo(() => {
    const copy = [...stories]

    if (sortMode === "recent") {
      return copy.sort((a, b) => {
        const left = new Date(a.publishedAt ?? a.updatedAt).getTime()
        const right = new Date(b.publishedAt ?? b.updatedAt).getTime()
        return right - left
      })
    }

    return copy.sort((a, b) => {
      if (b.readsCount !== a.readsCount) {
        return b.readsCount - a.readsCount
      }

      if (b.bookmarksCount !== a.bookmarksCount) {
        return b.bookmarksCount - a.bookmarksCount
      }

      return b.ratingsCount - a.ratingsCount
    })
  }, [sortMode, stories])

  if (isLoading) {
    return <StoriesGridSkeleton />
  }

  if (error) {
    return (
      <div className="border border-border/40 bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-serif text-2xl text-foreground">
          We could not load the library
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">{error}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          {query ? (
            <Button variant="outline" onClick={clearQuery}>
              Clear search
            </Button>
          ) : null}
        </div>
      </div>
    )
  }

  if (stories.length === 0) {
    return (
      <div className="border border-border/40 bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BookOpen className="h-5 w-5" />
        </div>
        <h2 className="mt-4 font-serif text-2xl text-foreground">
          {query ? "No stories matched your search" : "No published stories yet"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {query
            ? "Try adjusting your search terms and browse the full library again."
            : "Once authors publish novels, they will appear here automatically."}
        </p>
        {query ? (
          <div className="mt-6">
            <Button variant="outline" onClick={clearQuery}>
              Clear search
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {stories.length} {stories.length === 1 ? "Story" : "Stories"}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSortMode("popular")}
            className={
              sortMode === "popular"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Most Popular
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSortMode("recent")}
            className={
              sortMode === "recent"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Recent
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedStories.map((story) => {
          const coverSrc = resolveNovelCoverSrc({
            novelId: story.id,
            coverUrl: story.coverUrl,
            coverStorageKey: story.coverStorageKey,
          })

          return (
            <article
              key={story.id}
              className="flex flex-col overflow-hidden border border-border/40 bg-card transition-all hover:border-border/80 hover:shadow-sm"
            >
              <Link
                href={`/novel/${story.slug}`}
                className="block border-b border-border/40 bg-muted/20"
              >
                {coverSrc ? (
                  <img
                    src={coverSrc}
                    alt={`${story.title} cover`}
                    className="aspect-[16/9] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted/40 text-muted-foreground">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col p-6">
                <div className="flex-1">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-serif text-lg font-medium text-foreground">
                      <Link href={`/novel/${story.slug}`} className="hover:underline">
                        {story.title}
                      </Link>
                    </h3>
                    <div className="flex flex-shrink-0 flex-col items-end gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {story.genre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatWorkType(story.workType)}
                      </span>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    by{" "}
                    <span className="font-medium">
                      {story.author.displayName ?? "Anonymous"}
                    </span>
                  </p>
                  <p className="mb-4 text-xs text-muted-foreground">
                    {story.status}
                    {formatStoryDate(story.publishedAt) ? (
                      <> · {formatStoryDate(story.publishedAt)}</>
                    ) : null}
                  </p>
                  <p className="mb-4 line-clamp-3 text-sm text-foreground/80">
                    {story.summary || "A new story is waiting to be explored."}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-4">
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{story.chaptersCount} chapters</span>
                    <span>{story.readsCount.toLocaleString()} reads</span>
                    <span>{story.bookmarksCount.toLocaleString()} saves</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/novel/${story.slug}`}>Read</Link>
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
