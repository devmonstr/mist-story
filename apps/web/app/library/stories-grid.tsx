"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { NovelCard } from "@/components/novel/novel-card"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, RefreshCcw } from "lucide-react"
import { getNovelGenreLabel } from "@myth/shared"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { useLibraryCatalogContext } from "./library-catalog-context"
import {
  loadLibraryCatalog,
  type LibraryCatalogNovel,
  type LibraryCatalogResponse,
} from "./library-catalog"
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
  const {
    query,
    deferredQuery,
    sortBy,
    cursor,
    direction,
    genre,
    workType,
    status,
    collection,
    setCursorState,
    setGenre,
    setWorkType,
    setStatus,
    setCollection,
    clearQuery,
    clearFilters,
  } = useLibraryCatalogContext()
  const [stories, setStories] = useState<LibraryCatalogNovel[]>([])
  const [catalog, setCatalog] = useState<LibraryCatalogResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let isActive = true

    const timer = window.setTimeout(() => {
      setIsLoading(true)
      setError(null)

      void loadLibraryCatalog({
        query: deferredQuery,
        sortBy,
        cursor,
        direction,
        pageSize: 18,
        genre,
        workType,
        status,
        collection,
      })
        .then((payload) => {
          if (!isActive) {
            return
          }

          setCatalog(payload)
          setStories(payload.novels)
        })
        .catch((loadError) => {
          if (!isActive) {
            return
          }

          setCatalog(null)
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
  }, [collection, cursor, deferredQuery, direction, genre, refreshToken, sortBy, status, workType])

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
          <Button onClick={() => setRefreshToken((value) => value + 1)}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          {query ? (
            <Button variant="outline" onClick={clearQuery}>
              Clear search
            </Button>
          ) : null}
          {genre || workType || status || collection ? (
            <Button variant="outline" onClick={clearFilters}>
              Reset filters
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
          {query || genre || workType || status || collection
            ? "No stories matched your filters"
            : "No published stories yet"}
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">
          {query || genre || workType || status || collection
            ? "Try adjusting your search or filters and browse the full library again."
            : "Once authors publish novels, they will appear here automatically."}
        </p>
        {query || genre || workType || status || collection ? (
          <div className="mt-6 flex items-center justify-center gap-3">
            {query ? (
              <Button variant="outline" onClick={clearQuery}>
                Clear search
              </Button>
            ) : null}
            <Button variant="outline" onClick={clearFilters}>
              Reset filters
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
          {(catalog?.pagination.totalItems ?? catalog?.total ?? stories.length).toLocaleString()}{" "}
          {catalog?.pagination.totalItems === 1 || catalog?.total === 1 ? "Story" : "Stories"}
        </p>
        {catalog?.filters.genre ? (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {getNovelGenreLabel(catalog.filters.genre)}
          </span>
        ) : catalog?.filters.collection ? (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {catalog.filters.collection.replace(/-/g, " ")}
          </span>
        ) : null}
      </div>

      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setGenre(null)}
            className={
              !genre
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            All Genres
          </Button>
          {(catalog?.facets.genres ?? []).slice(0, 6).map((facet) => (
            <Button
              key={facet.value}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGenre(facet.value)}
              className={
                genre === facet.value
                  ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                  : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
              }
            >
              {facet.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="mr-1 self-center font-medium">Format</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWorkType(null)}
            className={
              !workType
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWorkType("ORIGINAL")}
            className={
              workType === "ORIGINAL"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Original
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setWorkType("TRANSLATION")}
            className={
              workType === "TRANSLATION"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Translation
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="mr-1 self-center font-medium">Status</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatus(null)}
            className={
              !status
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatus("Ongoing")}
            className={
              status === "Ongoing"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Ongoing
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatus("Completed")}
            className={
              status === "Completed"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Completed
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setStatus("Hiatus")}
            className={
              status === "Hiatus"
                ? "rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
                : "rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            }
          >
            Hiatus
          </Button>
          {genre || workType || status || collection ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            >
              Clear filters
            </Button>
          ) : null}
        </div>

        {collection ? (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="mr-1 self-center font-medium">Collection</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-none border border-black bg-black text-white shadow-none transition-none hover:bg-black hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white dark:hover:text-black"
            >
              {collection.replace(/-/g, " ")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCollection(null)}
              className="rounded-none border border-transparent bg-transparent text-muted-foreground shadow-none transition-none hover:bg-transparent hover:text-foreground"
            >
              Clear collection
            </Button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
        {stories.map((story) => {
          const coverSrc = resolveNovelCoverSrc({
            novelId: story.id,
            coverUrl: story.coverUrl,
            coverStorageKey: story.coverStorageKey,
          })
          const storyHref = `/novel/${story.slug}`
          const publishedAt = formatStoryDate(story.publishedAt)

          return (
            <NovelCard
              key={story.id}
              href={storyHref}
              title={story.title}
              coverSrc={coverSrc}
              authorName={story.author.displayName ?? "Anonymous"}
              summary={story.summary}
              titleAside={
                <>
                  <span className="border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                    {story.genre}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatWorkType(story.workType)}
                  </span>
                </>
              }
              meta={
                <>
                  {story.status}
                  {publishedAt ? ` / ${publishedAt}` : null}
                </>
              }
              footer={
                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{story.chaptersCount} chapters</span>
                    <span>{story.readsCount.toLocaleString()} reads</span>
                    <span>{story.bookmarksCount.toLocaleString()} saves</span>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={storyHref}>Read</Link>
                  </Button>
                </div>
              }
            />
          )
        })}
      </div>

      {catalog?.pagination.hasPreviousPage || catalog?.pagination.hasNextPage ? (
        <div className="mt-10 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {catalog.pagination.totalItems.toLocaleString()} Stories
          </p>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!catalog.pagination.hasPreviousPage}
              onClick={() =>
                setCursorState({
                  cursor: catalog.pagination.previousCursor,
                  direction: "prev",
                })
              }
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!catalog.pagination.hasNextPage}
              onClick={() =>
                setCursorState({
                  cursor: catalog.pagination.nextCursor,
                  direction: "next",
                })
              }
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </>
  )
}
