'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Clock, Loader2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { fetchMyLibrary } from '@/lib/api'
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

export default function HistoryPage() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [history, setHistory] = useState<MyLibraryContinueReadingDto[]>([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadHistory = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchMyLibrary()
        setHistory(payload.continueReading)
      } catch (error) {
        console.error("Failed to fetch reading history:", error)
      } finally {
        setIsFetching(false)
      }
    }

    void loadHistory()
  }, [isAuthenticated])

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">Reading History</h1>
          </div>
          <p className="text-muted-foreground">
            {history.length} {history.length === 1 ? 'story' : 'stories'} in progress
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
          <div className="space-y-4">
            {history.map((item) => (
              <article
                key={item.novelId}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        <Link href={`/novel/${item.novelId}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        By {item.authorDisplayName || "Unknown author"}
                      </p>
                    </div>

                    <div className="my-3 border-l-2 border-muted-foreground/30 pl-3">
                      <p className="text-sm font-medium text-foreground">
                        Chapter {item.currentChapterNumber}
                        {item.currentChapterTitle ? `: ${item.currentChapterTitle}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last read {formatRelativeDate(item.updatedAt)}
                      </p>
                    </div>

                    <div className="w-full">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Chapter {item.currentChapterNumber} of {item.totalChapters}
                        </span>
                        <span className="text-xs font-medium text-foreground">{item.progressPercent}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    <Button size="sm" asChild>
                      <Link href={`/novel/${item.novelId}/read/${item.currentChapterNumber}`}>
                        Continue
                      </Link>
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </main>
      <Footer />
    </div>
  )
}
