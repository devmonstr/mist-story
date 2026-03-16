"use client"

import { useAuth } from "@/context/auth-context"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreVertical,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Clock,
  BookOpen,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// Sample novels data
const SAMPLE_NOVELS = [
  {
    id: "1",
    title: "The Forgotten Kingdom",
    description: "A tale of magic and mystery in a world where kingdoms have fallen to darkness.",
    status: "published" as const,
    chapters: 24,
    totalWords: 87500,
    lastEdited: "2026-03-15T10:30:00Z",
    reads: 12450,
  },
  {
    id: "2",
    title: "Whispers in the Dark",
    description: "When shadows speak, only the brave dare to listen.",
    status: "draft" as const,
    chapters: 8,
    totalWords: 23400,
    lastEdited: "2026-03-14T16:45:00Z",
    reads: 0,
  },
  {
    id: "3",
    title: "The Last Astronaut",
    description: "Humanity's final hope drifts alone among the stars.",
    status: "draft" as const,
    chapters: 3,
    totalWords: 8200,
    lastEdited: "2026-03-10T09:15:00Z",
    reads: 0,
  },
  {
    id: "4",
    title: "Echoes of Tomorrow",
    description: "A time traveler's journey to prevent the end of everything.",
    status: "published" as const,
    chapters: 18,
    totalWords: 65300,
    lastEdited: "2026-02-28T14:20:00Z",
    reads: 8920,
  },
]

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
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all")

  // Redirect if not signed in
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/sign-in")
    }
  }, [user, isLoading, router])

  if (isLoading) {
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

  if (!user) {
    return null
  }

  const filteredNovels = SAMPLE_NOVELS.filter((novel) => {
    if (filter === "all") return true
    return novel.status === filter
  })

  const publishedCount = SAMPLE_NOVELS.filter((n) => n.status === "published").length
  const draftCount = SAMPLE_NOVELS.filter((n) => n.status === "draft").length
  const totalWords = SAMPLE_NOVELS.reduce((acc, n) => acc + n.totalWords, 0)
  const totalReads = SAMPLE_NOVELS.reduce((acc, n) => acc + n.reads, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Header */}
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

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Published</p>
                <p className="mt-1 text-2xl font-medium text-foreground">
                  {publishedCount}
                </p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Drafts</p>
                <p className="mt-1 text-2xl font-medium text-foreground">
                  {draftCount}
                </p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Words</p>
                <p className="mt-1 text-2xl font-medium text-foreground">
                  {formatNumber(totalWords)}
                </p>
              </div>
              <div className="border border-border/40 bg-card p-4">
                <p className="text-xs text-muted-foreground">Total Reads</p>
                <p className="mt-1 text-2xl font-medium text-foreground">
                  {formatNumber(totalReads)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Novels List */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Filter Tabs */}
          <div className="mb-6 flex items-center gap-1 border-b border-border/40">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === "all"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({SAMPLE_NOVELS.length})
            </button>
            <button
              onClick={() => setFilter("published")}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === "published"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Published ({publishedCount})
            </button>
            <button
              onClick={() => setFilter("draft")}
              className={`px-4 py-2 text-sm transition-colors ${
                filter === "draft"
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Drafts ({draftCount})
            </button>
          </div>

          {/* Novel Cards */}
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-medium text-foreground truncate">
                            <Link
                              href={`/studio/${novel.id}`}
                              className="hover:underline"
                            >
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
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {novel.description}
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
                          {novel.status === "published" && (
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(novel.reads)} reads
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/studio/${novel.id}`}>
                        <Pencil className="mr-2 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    {novel.status === "published" && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/novel/${novel.id}`}>
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More options</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/studio/${novel.id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Novel
                          </Link>
                        </DropdownMenuItem>
                        {novel.status === "published" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/novel/${novel.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Public Page
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <Separator className="my-1" />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Novel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
