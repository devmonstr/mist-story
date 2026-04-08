"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ChevronRight, Loader2, Lock } from "lucide-react"
import {
  type PublicNovelChapterListDto,
  type PublicNovelChapterDto,
  type PublicNovelDetailDto,
} from "@mist/shared"
import { isChapterUnlocked } from "@/lib/zap-utils"
import { formatPublishedDate } from "./novel-utils"
import { fetchPublicNovelDetail } from "@/lib/api"

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

interface GroupData {
  chapters: PublicNovelChapterDto[]
  chapterList: PublicNovelChapterListDto
}

export function ChapterList({ novel, chapters, chapterList }: ChapterListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set())
  const [openGroup, setOpenGroup] = useState<number | null>(chapterList.currentPage)
  const [loadingGroup, setLoadingGroup] = useState<number | null>(null)
  const [groupCache, setGroupCache] = useState<Record<number, GroupData>>({
    [chapterList.currentPage]: { chapters, chapterList },
  })
  const groupRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

  // Track current chapter from URL (if user navigated from reader)
  const currentChapterNumber = useMemo(() => {
    const match = pathname.match(/\/read\/(\d+)/)
    return match ? Number.parseInt(match[1], 10) : null
  }, [pathname])

  // Build unlocked chapters set
  useEffect(() => {
    const unlocked = new Set<string>()
    const allCachedChapters = Object.values(groupCache).flatMap((g) => g.chapters)
    const chaptersToCheck = allCachedChapters.length > 0 ? allCachedChapters : chapters

    for (const chapter of chaptersToCheck) {
      if (isChapterUnlocked(novel.id, String(chapter.number))) {
        unlocked.add(String(chapter.number))
      }
    }

    setUnlockedSet(unlocked)
  }, [chapters, novel.id, groupCache])

  // Auto-open current group and scroll to it
  const currentGroupRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (currentGroupRef.current) {
      currentGroupRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [chapterList.currentPage])

  useEffect(() => {
    setOpenGroup(chapterList.currentPage)
    setGroupCache((previous) => ({
      ...previous,
      [chapterList.currentPage]: { chapters, chapterList },
    }))
  }, [chapterList, chapters])

  const groups = useMemo(
    () =>
      Array.from({ length: chapterList.totalPages }, (_, index) => {
        const page = index + 1
        return {
          page,
          ...getGroupRange(page, chapterList.pageSize, chapterList.maxChapterNumber),
        }
      }),
    [chapterList.maxChapterNumber, chapterList.pageSize, chapterList.totalPages]
  )

  const loadGroup = useCallback(
    async (groupPage: number) => {
      if (groupCache[groupPage]) {
        return
      }

      setLoadingGroup(groupPage)
      try {
        const payload = await fetchPublicNovelDetail(novel.id, { chapterPage: groupPage })
        setGroupCache((previous) => ({
          ...previous,
          [groupPage]: {
            chapters: payload.chapters,
            chapterList: payload.chapterList,
          },
        }))
      } catch (error) {
        console.error(`Failed to load group ${groupPage}:`, error)
      } finally {
        setLoadingGroup(null)
      }
    },
    [novel.id, groupCache]
  )

  const handleGroupToggle = useCallback(
    (groupPage: number) => {
      if (openGroup === groupPage) {
        setOpenGroup(null)
        return
      }

      setOpenGroup(groupPage)

      // Load group data if not cached
      void loadGroup(groupPage)

      // Update URL without reload
      if (groupPage !== chapterList.currentPage) {
        router.replace(`/novel/${novel.slug}?chapterPage=${groupPage}`, {
          scroll: false,
        })
      }

      // Scroll to group after loading
      setTimeout(() => {
        groupRefs.current.get(groupPage)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
      }, 100)
    },
    [openGroup, chapterList.currentPage, novel.slug, router, loadGroup]
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
          Browse by groups. Tap a group to load its chapters.
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
            const isOpen = openGroup === group.page
            const isLoading = loadingGroup === group.page
            const cachedData = groupCache[group.page] ?? null
            const groupChapters = cachedData?.chapters ?? (isCurrentGroup ? chapters : [])

            // Sort chapters by number to ensure consistent ordering
            const sortedChapters = [...groupChapters].sort((a, b) => a.number - b.number)

            return (
              <div
                key={group.page}
                ref={(node) => {
                  groupRefs.current.set(group.page, node)
                  if (isCurrentGroup) {
                    currentGroupRef.current = node
                  }
                }}
                className="overflow-hidden rounded-2xl border border-border/50 bg-background"
              >
                <button
                  type="button"
                  onClick={() => handleGroupToggle(group.page)}
                  disabled={isLoading}
                  aria-expanded={isOpen}
                  aria-label={`Chapters ${group.start.toLocaleString()} to ${group.end.toLocaleString()}, ${isOpen ? "open" : "collapsed"}`}
                  className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Chapters {group.start.toLocaleString()}-{group.end.toLocaleString()}
                    </p>
                    {isCurrentGroup && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Current
                      </span>
                    )}
                    {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                  </div>
                  {isLoading ? null : isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isOpen ? (
                  <div className="border-t border-border/40">
                    {sortedChapters.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        No chapters in this group.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {sortedChapters.map((chapter) => {
                          const isPaid = chapter.isPaid && Boolean(chapter.priceSats)
                          const isUnlocked = !isPaid || unlockedSet.has(String(chapter.number))
                          const isCurrentChapter = currentChapterNumber === chapter.number

                          return (
                            <Link
                              key={chapter.id}
                              href={`/novel/${novel.slug}/read/${chapter.number}?chapterPage=${group.page}`}
                              aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
                              className={`group flex items-center justify-between py-3 pl-4 pr-4 transition-colors hover:bg-muted/30 ${
                                isCurrentChapter ? "bg-primary/5" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`text-sm font-medium ${
                                    isCurrentChapter
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {chapter.number}
                                </span>
                                <div>
                                  <p
                                    className={`font-medium group-hover:text-foreground/80 ${
                                      isCurrentChapter
                                        ? "text-primary"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {chapter.title}
                                  </p>
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
                    )}
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
