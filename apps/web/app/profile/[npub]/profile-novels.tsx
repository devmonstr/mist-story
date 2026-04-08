"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { NovelCard } from "@/components/novel/novel-card"
import { BookOpen, Heart, Library, Loader2 } from "lucide-react"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { useProfileShell } from "./profile-shell"

const PROFILE_NOVELS_PAGE_SIZE = 10

function formatPublishedDate(value: string | null) {
  if (!value) {
    return "Published recently"
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function ProfileNovels() {
  const { data, isLoading } = useProfileShell()
  const [page, setPage] = useState(1)
  const profileNpub = data?.profile.npub ?? null
  const novels = useMemo(() => data?.novels ?? [], [data?.novels])
  const totalItems = novels.length
  const totalPages = Math.max(1, Math.ceil(totalItems / PROFILE_NOVELS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visibleFrom = totalItems === 0 ? 0 : (currentPage - 1) * PROFILE_NOVELS_PAGE_SIZE + 1
  const visibleTo = Math.min(currentPage * PROFILE_NOVELS_PAGE_SIZE, totalItems)
  const visibleNovels = useMemo(() => {
    const start = (currentPage - 1) * PROFILE_NOVELS_PAGE_SIZE
    return novels.slice(start, start + PROFILE_NOVELS_PAGE_SIZE)
  }, [currentPage, novels])

  useEffect(() => {
    setPage(1)
  }, [profileNpub])

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  if (isLoading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
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
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-foreground">Novels</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {totalItems > 0
              ? `${totalItems} published ${totalItems === 1 ? "story" : "stories"} on this profile`
              : "Published work will appear here once the author shares their first story."}
          </p>
        </div>
      </div>

      {totalItems === 0 ? (
        <div className="border border-border/40 bg-card px-6 py-12 text-center">
          <Library className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-4 font-serif text-xl font-semibold text-foreground">
            No published novels yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back later for new releases from this writer.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-3 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {visibleFrom}-{visibleTo} of {totalItems}
            </div>
            {totalPages > 1 ? (
              <div className="text-sm text-muted-foreground">
                Page {currentPage} / {totalPages}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleNovels.map((novel) => {
              const novelHref = `/novel/${novel.slug}`
              const coverSrc = resolveNovelCoverSrc({
                novelId: novel.id,
                coverUrl: novel.coverUrl,
                coverStorageKey: novel.coverStorageKey,
              })

              return (
                <NovelCard
                  key={novel.id}
                  href={novelHref}
                  title={novel.title}
                  coverSrc={coverSrc}
                  coverAlt={novel.title}
                  authorName={data.profile.displayName || data.profile.handle || "Unknown author"}
                  summary={novel.summary}
                  titleAside={
                    <>
                      <span className="border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
                        {novel.genre}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {novel.chaptersCount} chapters
                      </span>
                    </>
                  }
                  afterSummary={
                    <>
                      <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                        <p>Published {formatPublishedDate(novel.publishedAt)}</p>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {novel.readsCount.toLocaleString()} reads
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5" />
                            {novel.ratingsCount.toLocaleString()} ratings
                          </span>
                        </div>
                      </div>
                    </>
                  }
                  footer={
                    <div className="mt-4">
                      <Button size="sm" className="w-full" asChild>
                        <Link href={novelHref}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          Read Story
                        </Link>
                      </Button>
                    </div>
                  }
                />
              )
            })}
          </div>

          {totalPages > 1 ? (
            <div className="flex flex-col gap-3 border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {visibleFrom}-{visibleTo} of {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                >
                  Prev
                </Button>
                <div className="min-w-16 border border-border px-3 py-2 text-center text-sm">
                  {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
