"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BookOpen,
  Clock,
  FileText,
  Loader2,
  Plus,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { fetchStudioNovels } from "@/lib/api"
import { mapNovelToCard, type StudioNovelCard } from "@/lib/studio"

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export default function StudioPage() {
  const { user, isLoading, isAuthenticated } = useRequireAuth()
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")
  const [novels, setNovels] = useState<StudioNovelCard[]>([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!user) return

    const loadNovels = async () => {
      try {
        setIsFetching(true)
        const items = await fetchStudioNovels()
        setNovels(items.map(mapNovelToCard))
      } catch (error) {
        console.error("Failed to fetch studio novels:", error)
      } finally {
        setIsFetching(false)
      }
    }

    void loadNovels()
  }, [user])

  const filteredNovels = useMemo(() => {
    return novels.filter((novel) => (filter === "all" ? true : novel.status === filter))
  }, [filter, novels])

  const publishedCount = novels.filter((novel) => novel.status === "published").length
  const draftCount = novels.filter((novel) => novel.status === "draft").length
  const totalWords = novels.reduce((acc, novel) => acc + novel.totalWords, 0)
  const totalReads = novels.reduce((acc, novel) => acc + novel.reads, 0)

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

  if (!isAuthenticated) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-serif text-2xl font-medium text-foreground sm:text-3xl">
                  Writer Studio
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your novels and track your writing progress
                </p>
              </div>
              <Button asChild>
                <Link href="/studio/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Novel
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{publishedCount}</p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{draftCount}</p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Words</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{formatNumber(totalWords)}</p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Reads</p>
                <p className="mt-1 text-2xl font-medium text-foreground">{formatNumber(totalReads)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-1 border-b border-border/40">
            {(["all", "published", "draft"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 text-sm transition-colors ${
                  filter === value
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "all"
                  ? `All (${novels.length})`
                  : value === "published"
                    ? `Published (${publishedCount})`
                    : `Drafts (${draftCount})`}
              </button>
            ))}
          </div>

          {filteredNovels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 font-serif text-lg font-medium text-foreground">
                No novels yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start writing your first novel today
              </p>
              <Button asChild className="mt-4">
                <Link href="/studio/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Novel
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNovels.map((novel) => (
                <article
                  key={novel.id}
                  className="flex flex-col gap-4 border border-border/40 bg-card p-4 transition-colors hover:border-border/80 sm:flex-row sm:items-start sm:justify-between sm:p-6"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-muted">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate font-serif text-lg font-medium text-foreground">
                            <Link href={`/studio/${novel.id}`} className="hover:underline">
                              {novel.title}
                            </Link>
                          </h3>
                          <span
                            className={`shrink-0 px-2 py-0.5 text-xs ${
                              novel.status === "published"
                                ? "bg-foreground/10 text-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {novel.status === "published" ? "Published" : "Draft"}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {novel.description || "No description yet"}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {novel.chapters} chapters
                          </span>
                          <span>{formatNumber(novel.totalWords)} words</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(novel.lastEdited)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                      <Link href={`/studio/${novel.id}/settings`}>Settings</Link>
                    </Button>
                    <Button asChild>
                      <Link href={`/studio/${novel.id}`}>Open</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}
