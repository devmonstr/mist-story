"use client"

import { use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, BookOpen } from "lucide-react"

const authorNovels = [
  {
    id: "1",
    title: "The Forgotten Kingdom",
    genre: "Fantasy",
    chapters: 24,
    status: "published" as const,
    reads: 12400,
    likes: 1203,
  },
  {
    id: "2",
    title: "Echoes of Tomorrow",
    genre: "Science Fiction",
    chapters: 18,
    status: "publishing" as const,
    reads: 8900,
    likes: 892,
  },
  {
    id: "3",
    title: "Between Worlds",
    genre: "Literary Fiction",
    chapters: 12,
    status: "published" as const,
    reads: 5320,
    likes: 621,
  },
  {
    id: "4",
    title: "Untitled Project",
    genre: "Fantasy",
    chapters: 3,
    status: "draft" as const,
    reads: 0,
    likes: 0,
  },
]

export function ProfileNovels({ params }: { params: Promise<{ npub: string }> }) {
  const { npub } = use(params)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Novels</h2>

      <div className="space-y-4">
        {authorNovels.map((novel) => (
          <article
            key={novel.id}
            className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-start gap-3">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  <Link href={`/novel/${novel.id}`} className="hover:underline">
                    {novel.title}
                  </Link>
                </h3>
                <span
                  className={`mt-1 whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${
                    novel.status === "published"
                      ? "bg-primary/10 text-primary"
                      : novel.status === "publishing"
                        ? "bg-muted text-muted-foreground"
                        : "bg-border text-foreground/60"
                  }`}
                >
                  {novel.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{novel.genre}</p>
              <p className="mt-1 text-sm text-muted-foreground">{novel.chapters} chapters</p>
            </div>

            <div className="flex flex-col gap-2 text-right sm:items-end">
              <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {novel.reads.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {novel.likes.toLocaleString()}
                </span>
              </div>
              {novel.status !== "draft" && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/novel/${novel.id}`}>Read</Link>
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
