"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Lock } from "lucide-react"
import {
  type PublicNovelChapterListDto,
  type PublicNovelChapterDto,
  type PublicNovelDetailDto,
} from "@mist/shared"
import { isChapterUnlocked } from "@/lib/zap-utils"
import { formatPublishedDate } from "./novel-utils"

interface ChapterListProps {
  novel: PublicNovelDetailDto
  chapters: PublicNovelChapterDto[]
  chapterList: PublicNovelChapterListDto
}

function getGroupRange(
  page: number,
  pageSize: number,
  maxChapterNumber: number
) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, maxChapterNumber)
  return { start, end }
}

export function ChapterList({ novel, chapters, chapterList }: ChapterListProps) {
  const router = useRouter()
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set())
  const [openGroup, setOpenGroup] = useState(`group-${chapterList.currentPage}`)

  useEffect(() => {
    const unlocked = new Set<string>()

    for (const chapter of chapters) {
      if (isChapterUnlocked(novel.id, String(chapter.number))) {
        unlocked.add(String(chapter.number))
      }
    }

    setUnlockedSet(unlocked)
  }, [chapters, novel.id])

  useEffect(() => {
    setOpenGroup(`group-${chapterList.currentPage}`)
  }, [chapterList.currentPage])

  const groups = useMemo(
    () =>
      Array.from({ length: chapterList.totalPages }, (_, index) => {
        const page = index + 1
        return {
          page,
          key: `group-${page}`,
          ...getGroupRange(page, chapterList.pageSize, chapterList.maxChapterNumber),
        }
      }),
    [chapterList.maxChapterNumber, chapterList.pageSize, chapterList.totalPages]
  )

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Chapters</h2>
        <span className="text-sm text-muted-foreground">
          {novel.chaptersCount.toLocaleString()} chapters
        </span>
      </div>

      {novel.chaptersCount > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Browse by groups. Only the open group is loaded to keep large stories fast.
        </p>
      ) : null}

      {chapters.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground">
          No published chapters yet.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {groups.map((group) => {
            const isCurrentGroup = group.page === chapterList.currentPage
            const isOpen = openGroup === group.key

            return (
              <div
                key={group.key}
                className="overflow-hidden rounded-2xl border border-border/50 bg-background"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isCurrentGroup) {
                      setOpenGroup((previous) => (previous === group.key ? "" : group.key))
                      return
                    }

                    setOpenGroup(group.key)
                    router.replace(`/novel/${novel.slug}?chapterPage=${group.page}`, {
                      scroll: false,
                    })
                  }}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Chapters {group.start.toLocaleString()}-{group.end.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Group {group.page} of {chapterList.totalPages}
                      {isCurrentGroup ? " · current" : ""}
                    </p>
                  </div>
                  {isCurrentGroup && isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isCurrentGroup && isOpen ? (
                  <div className="border-t border-border/40">
                    <div className="px-4 py-3 text-xs text-muted-foreground">
                      Showing loaded chapters {chapterList.visibleFrom.toLocaleString()}-
                      {chapterList.visibleTo.toLocaleString()} of{" "}
                      {chapterList.maxChapterNumber.toLocaleString()}
                    </div>
                    <div className="divide-y divide-border/40">
                      {chapters.map((chapter) => {
                        const isPaid = chapter.isPaid && Boolean(chapter.priceSats)
                        const isUnlocked = !isPaid || unlockedSet.has(String(chapter.number))

                        return (
                          <Link
                            key={chapter.id}
                            href={`/novel/${novel.slug}/read/${chapter.number}?chapterPage=${group.page}`}
                            className="group flex items-center justify-between py-4 pl-4 pr-4 transition-colors hover:bg-muted/30"
                          >
                            <div className="flex items-center gap-4">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                                {chapter.number}
                              </span>
                              <div>
                                <p className="font-medium text-foreground group-hover:text-foreground/80">
                                  {chapter.title}
                                </p>
                                {chapter.previewText ? (
                                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                    {chapter.previewText}
                                  </p>
                                ) : null}
                                <p className="text-xs text-muted-foreground">
                                  {formatPublishedDate(chapter.publishedAt)} ·{" "}
                                  {chapter.wordCount.toLocaleString()} words
                                  {isPaid && !isUnlocked ? (
                                    <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                      <Lock className="h-3 w-3" />
                                      {chapter.priceSats} sats
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPaid && !isUnlocked ? (
                                <Lock className="h-4 w-4 text-muted-foreground/60" />
                              ) : null}
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
