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
import { BookOpen, Clock, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { clearReadingProgress, fetchMyLibrary, removeReadingProgress } from '@/lib/api'
import { resolveNovelCoverSrc } from '@/lib/novel-cover'
import type { MyLibraryContinueReadingDto } from '@mist/shared'

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "just now"
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatHistoryContext(item: MyLibraryContinueReadingDto) {
  return `Chapter ${item.currentChapterNumber} of ${item.totalChapters}`
}

export default function HistoryPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const [history, setHistory] = useState<MyLibraryContinueReadingDto[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.npub) {
      setHistory([])
      setIsFetching(false)
      return
    }

    let cancelled = false

    const loadHistory = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchMyLibrary()
        if (!cancelled) {
          setHistory(payload.continueReading)
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch reading history:", error)
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    void loadHistory()

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
      await removeReadingProgress(novelId)
      setHistory((current) => current.filter((item) => item.novelId !== novelId))
    } catch (error) {
      console.error("Failed to remove reading progress:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClearAll = async () => {
    try {
      setIsSubmitting(true)
      await clearReadingProgress()
      setHistory([])
    } catch (error) {
      console.error("Failed to clear reading history:", error)
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
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h1 className={pageHeadingTitleClassName}>Reading History</h1>
                <p className={pageHeadingLeadClassName}>
                  {history.length} {history.length === 1 ? 'story' : 'stories'} ordered by your latest reading session
                </p>
              </div>
              {history.length > 0 && (
                <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => void handleClearAll()}>
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={`${pageContentContainerClassName} pt-8 sm:pt-10 lg:pt-12`}>
          {history.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">No reading history</h3>
              <p className="mb-6 text-muted-foreground">Start reading stories and your progress will appear here.</p>
              <Button asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
              {history.map((item) => {
                const novelHref = `/novel/${item.novelId}`
                const continueHref = `/novel/${item.novelId}/read/${item.currentChapterNumber}`
                const coverSrc = resolveNovelCoverSrc({
                  novelId: item.novelId,
                  coverUrl: item.coverUrl,
                  coverStorageKey: item.coverStorageKey,
                })

                return (
                  <NovelCard
                    key={item.novelId}
                    href={novelHref}
                    title={item.title}
                    coverSrc={coverSrc}
                    coverAlt={item.title}
                    authorName={item.authorDisplayName || "Unknown author"}
                    hideSummary
                    titleAside={
                      <>
                        <span className="border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {item.genre}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatRelativeDate(item.updatedAt)}
                        </span>
                      </>
                    }
                    afterSummary={
                      <>
                        <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                          <p className="flex items-center gap-2 text-foreground">
                            <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                            Continue from chapter {item.currentChapterNumber}
                            {item.currentChapterTitle ? `: ${item.currentChapterTitle}` : ""}
                          </p>
                          <p>{formatHistoryContext(item)}</p>
                          <p>Last read {formatRelativeDate(item.updatedAt)}</p>
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                              Progress
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {item.progressPercent}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden bg-muted">
                            <div
                              className="h-full bg-foreground transition-all"
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </>
                    }
                    footer={
                      <div className="mt-4">
                        <Button size="sm" className="w-full" asChild>
                          <Link href={continueHref}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Continue Reading
                          </Link>
                        </Button>
                      </div>
                    }
                    coverOverlay={
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isSubmitting}
                        onClick={() => void handleRemove(item.novelId)}
                        title="Remove from history"
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
