'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Bookmark, Loader2, Trash2 } from 'lucide-react'
import { useRequireAuth } from '@/hooks/use-require-auth'
import { fetchMyLibrary, removeBookmark } from '@/lib/api'
import type { MyLibrarySavedNovelDto } from '@mist/shared'

function formatSavedDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function BookmarksPage() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [bookmarks, setBookmarks] = useState<MyLibrarySavedNovelDto[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadBookmarks = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchMyLibrary()
        setBookmarks(payload.savedNovels)
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error)
      } finally {
        setIsFetching(false)
      }
    }

    void loadBookmarks()
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
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <Bookmark className="h-8 w-8 text-foreground" />
            <h1 className="font-serif text-3xl font-bold text-foreground">My Bookmarks</h1>
          </div>
          <p className="text-muted-foreground">
            {bookmarks.length} saved {bookmarks.length === 1 ? 'story' : 'stories'}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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
          <div className="space-y-4">
            {bookmarks.map((novel) => (
              <article
                key={novel.novelId}
                className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-start gap-2">
                      <h3 className="font-serif text-lg font-semibold text-foreground">
                        <Link href={`/novel/${novel.novelId}`} className="hover:underline">
                          {novel.title}
                        </Link>
                      </h3>
                      <span className="whitespace-nowrap rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground">
                        {novel.genre}
                      </span>
                    </div>
                    <p className="mb-2 text-sm text-muted-foreground">By {novel.authorDisplayName || "Unknown author"}</p>
                    <p className="mb-3 text-sm leading-relaxed text-foreground">{novel.summary}</p>
                    <div className="mb-3 flex items-center gap-6 text-sm text-muted-foreground">
                      <span>Saved {formatSavedDate(novel.savedAt)}</span>
                      <span>
                        {novel.progressPercent > 0
                          ? `${novel.progressPercent}% read`
                          : "Not started"}
                      </span>
                    </div>

                    {novel.progressPercent > 0 && (
                      <div className="w-full">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Reading Progress</span>
                          <span className="text-xs font-medium text-foreground">{novel.progressPercent}%</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${novel.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:flex-col sm:items-end">
                    <Button size="sm" asChild>
                      <Link
                        href={
                          novel.currentChapterNumber
                            ? `/novel/${novel.novelId}/read/${novel.currentChapterNumber}`
                            : `/novel/${novel.novelId}`
                        }
                      >
                        {novel.currentChapterNumber ? 'Continue Reading' : 'Open Story'}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isSubmitting}
                      onClick={() => void handleRemove(novel.novelId)}
                      title="Remove from bookmarks"
                    >
                      <Trash2 className="h-4 w-4" />
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
