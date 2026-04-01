"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { BookMarked, Bookmark, Clock, LibraryBig, Loader2 } from "lucide-react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { fetchMyLibrary } from "@/lib/api"
import type { MyLibraryResponse } from "@mist/shared"

function formatRelativeDate(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return "Updated just now"
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

function formatSavedDate(value: string) {
  const date = new Date(value)
  return `Saved ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
}

export default function MyLibraryPage() {
  const { isLoading, isAuthenticated } = useRequireAuth()
  const [library, setLibrary] = useState<MyLibraryResponse | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const loadLibrary = async () => {
      try {
        setIsFetching(true)
        const payload = await fetchMyLibrary()
        setLibrary(payload)
      } catch (error) {
        console.error("Failed to fetch my library:", error)
      } finally {
        setIsFetching(false)
      }
    }

    void loadLibrary()
  }, [isAuthenticated])

  const stats = useMemo(() => {
    return {
      continueReading: library?.continueReading.length ?? 0,
      savedStories: library?.savedNovels.length ?? 0,
    }
  }, [library])

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
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <LibraryBig className="h-6 w-6 text-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-medium text-foreground">
                  My Library
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Your personal shelf for saved stories, reading progress, and quick access to
                  what you want to pick up next.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Continue Reading</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{stats.continueReading}</p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Saved Stories</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{stats.savedStories}</p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Public Catalog</p>
                <Button variant="link" asChild className="mt-1 h-auto p-0">
                  <Link href="/library">Browse Library</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-serif text-2xl font-medium text-foreground">
                Continue Reading
              </h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/history">View Full History</Link>
            </Button>
          </div>

          {library && library.continueReading.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {library.continueReading.map((item) => (
                <article
                  key={item.novelId}
                  className="border border-border/40 bg-card p-6 transition-colors hover:border-border/80"
                >
                  <p className="text-xs text-muted-foreground">{formatRelativeDate(item.updatedAt)}</p>
                  <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
                    <Link href={`/novel/${item.novelId}`} className="hover:underline">
                      {item.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">By {item.authorDisplayName || "Unknown author"}</p>
                  <p className="mt-4 text-sm text-foreground">
                    Chapter {item.currentChapterNumber} of {item.totalChapters}
                    {item.currentChapterTitle ? `: ${item.currentChapterTitle}` : ""}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Reading progress</span>
                      <span>{item.progressPercent}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                  <Button className="mt-5" asChild>
                    <Link href={`/novel/${item.novelId}/read/${item.currentChapterNumber}`}>Continue</Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border/60 bg-card/50 p-8 text-center">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
                Nothing in progress yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Start reading a story and your progress will appear here.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-serif text-2xl font-medium text-foreground">Saved Stories</h2>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/bookmarks">Manage Bookmarks</Link>
            </Button>
          </div>

          {library && library.savedNovels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {library.savedNovels.map((item) => (
                <article
                  key={item.novelId}
                  className="flex flex-col border border-border/40 bg-card p-6 transition-colors hover:border-border/80"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground">
                        <Link href={`/novel/${item.novelId}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        By {item.authorDisplayName || "Unknown author"}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {item.genre}
                    </span>
                  </div>
                  <p className="flex-1 text-sm text-foreground/80">{item.summary}</p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatSavedDate(item.savedAt)}</span>
                    <span>
                      {item.progressPercent > 0
                        ? `${item.progressPercent}% read`
                        : "Not started"}
                    </span>
                  </div>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link
                      href={
                        item.currentChapterNumber
                          ? `/novel/${item.novelId}/read/${item.currentChapterNumber}`
                          : `/novel/${item.novelId}`
                      }
                    >
                      <BookMarked className="mr-2 h-4 w-4" />
                      {item.currentChapterNumber ? "Continue Story" : "Open Story"}
                    </Link>
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border/60 bg-card/50 p-8 text-center">
              <Bookmark className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-4 font-serif text-xl font-medium text-foreground">
                No saved stories yet
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Bookmark stories you love and they will show up here.
              </p>
              <Button className="mt-5" asChild>
                <Link href="/library">Explore Stories</Link>
              </Button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
