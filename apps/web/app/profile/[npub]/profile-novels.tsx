"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Heart, BookOpen } from "lucide-react"
import { Loader2 } from "lucide-react"
import { useProfileShell } from "./profile-shell"

export function ProfileNovels() {
  const { data, isLoading } = useProfileShell()

  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="font-serif text-2xl font-bold text-foreground mb-8">Novels</h2>

      {data.novels.length === 0 ? (
        <div className="border border-border/40 bg-card p-8 text-center text-muted-foreground">
          No published novels yet.
        </div>
      ) : (
      <div className="space-y-4">
        {data.novels.map((novel) => (
          <article
            key={novel.id}
            className="flex flex-col gap-4 border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex-1 space-y-2">
              <div className="flex items-start gap-3">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  <Link href={`/novel/${novel.slug}`} className="hover:underline">
                    {novel.title}
                  </Link>
                </h3>
                <span className="mt-1 whitespace-nowrap rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  published
                </span>
              </div>
              {novel.summary && (
                <p className="text-sm leading-relaxed text-muted-foreground">{novel.summary}</p>
              )}
              <p className="mt-2 text-sm text-muted-foreground">{novel.genre}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {novel.chaptersCount} chapters
              </p>
            </div>

            <div className="flex flex-col gap-2 text-right sm:items-end">
              <div className="flex items-center justify-end gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {novel.readsCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {novel.ratingsCount.toLocaleString()}
                </span>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/novel/${novel.slug}`}>Read</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
      )}
    </div>
  )
}
