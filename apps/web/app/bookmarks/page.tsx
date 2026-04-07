'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { NovelCard } from "@/components/novel/novel-card"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { BookOpen, Bookmark, Loader2, Trash2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { fetchMyLibrary, removeBookmark } from '@/lib/api'
import { resolveNovelCoverSrc } from '@/lib/novel-cover'
import type { MyLibrarySavedNovelDto } from '@mist/shared'

function formatSavedDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatRelativeUpdate(value: string | null) {
  if (!value) {
    return "No chapter updates yet"
  }

  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Updated just now"
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`

  return `Updated ${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`
}

export default function BookmarksPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const [bookmarks, setBookmarks] = useState<MyLibrarySavedNovelDto[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.npub) {
      setBookmarks([])
      setIsFetching(false)
      return
    }

    let cancelled = false

    const loadBookmarks = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchMyLibrary()
        if (!cancelled) {
          setBookmarks(payload.savedNovels)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch bookmarks:", error)
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    void loadBookmarks()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.npub])

  if (isLoading || isFetching) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleRemove = async (novelId: string) => {
    try {
      setIsSubmitting(true)
      await removeBookmark(novelId)
      setBookmarks((current) => current.filter((bookmark) => bookmark.novelId !== novelId))
    } catch (error) {
      console.error("Failed to remove bookmark:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="border-b border-border">
          <div className={`${pageContentContainerClassName} ${pageSectionPaddingClassName}`}>
            <h1 className={pageHeadingTitleClassName}>My Bookmarks</h1>
            <p className={pageHeadingLeadClassName}>
              {bookmarks.length} saved {bookmarks.length === 1 ? 'story' : 'stories'} ordered by latest chapter activity
            </p>
          </div>
        </div>

        <div className={`${pageContentContainerClassName} pt-6 sm:pt-8`}>
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center">
              <Bookmark className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">No bookmarks yet</h3>
              <p className="mb-6 text-muted-foreground">Start exploring and save stories you want to come back to.</p>
              <Button asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
              {bookmarks.map((novel) => {
                const coverSrc = resolveNovelCoverSrc({
                  novelId: novel.novelId,
                  coverUrl: novel.coverUrl,
                  coverStorageKey: novel.coverStorageKey,
                })
                const novelHref = `/novel/${novel.novelId}`

                return (
                  <NovelCard
                    key={novel.novelId}
                    href={novelHref}
                    title={novel.title}
                    coverSrc={coverSrc}
                    coverAlt={novel.title}
                    authorName={novel.authorDisplayName || "Unknown author"}
                    summary={novel.summary}
                    titleAside={
                      <>
                        <span className="border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {novel.genre}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {novel.progressPercent > 0
                            ? `${novel.progressPercent}% read`
                            : "Not started"}
                        </span>
                      </>
                    }
                    afterSummary={
                      <>
                        <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                          <p>{formatRelativeUpdate(novel.latestChapterUpdatedAt)}</p>
                          <p>Saved {formatSavedDate(novel.savedAt)}</p>
                        </div>

                        {novel.progressPercent > 0 ? (
                          <div className="mt-4">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-xs font-medium text-foreground">
                                {novel.progressPercent}%
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden bg-muted">
                              <div
                                className="h-full bg-foreground transition-all"
                                style={{ width: `${novel.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </>
                    }
                    footer={
                      <div className="mt-4">
                        <Button size="sm" className="w-full" asChild>
                          <Link
                            href={
                              novel.currentChapterNumber
                                ? `/novel/${novel.novelId}/read/${novel.currentChapterNumber}`
                                : novelHref
                            }
                          >
                            <BookOpen className="mr-2 h-4 w-4" />
                            {novel.currentChapterNumber ? "Continue" : "Open Story"}
                          </Link>
                        </Button>
                      </div>
                    }
                    coverOverlay={
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        onClick={() => void handleRemove(novel.novelId)}
                        title="Remove from bookmarks"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    }
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
