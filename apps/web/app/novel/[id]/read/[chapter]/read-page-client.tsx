"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { use } from "react"
import {
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Home,
  List,
  Loader2,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  Settings,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { buildSignInPath } from "@/lib/auth-routes"
import {
  addBookmark,
  fetchPublicNovelDetail,
  fetchPublicNovelChapter,
  removeBookmark,
  updateReadingProgress,
} from "@/lib/api"
import { npubToHex } from "@/lib/nostr-utils"
import { ZapPaywall } from "@/components/zap-paywall"
import { isChapterUnlocked, storeZapReceipt } from "@/lib/zap-utils"
import {
  type PublicNovelChapterDto,
  type PublicNovelChapterListDto,
  type PublicNovelReaderResponse,
} from "@mist/shared"

const READER_SETTINGS_KEY = "mist-story-reader-settings"
const READING_PROGRESS_KEY = "mist-story-reading-progress"

function getDefaultThemeStyles(readerTheme: "light" | "dark" | "sepia") {
  return {
    light: {
      bg: "bg-background text-foreground",
      header: "border-border/40 bg-background/95",
      sheet: "",
      sheetText: "",
      mutedText: "text-muted-foreground",
      border: "bg-border",
      icon: "text-muted-foreground/50",
      contentText: "text-foreground/90",
      progressBar: "bg-primary",
      highlightBg: "bg-primary/5",
      highlightText: "text-primary",
      skeleton: "bg-muted",
    },
    dark: {
      bg: "bg-[#1a1a1a] text-[#e0e0e0]",
      header: "border-[#333] bg-[#1a1a1a]/95",
      sheet: "bg-[#1a1a1a] text-[#e0e0e0] border-[#333]",
      sheetText: "text-[#e0e0e0]",
      mutedText: "text-[#888]",
      border: "bg-[#333]",
      icon: "text-[#555]",
      contentText: "text-[#d0d0d0]",
      progressBar: "bg-[#4a9eff]",
      highlightBg: "bg-[#333]",
      highlightText: "text-[#4a9eff]",
      skeleton: "bg-[#333]",
    },
    sepia: {
      bg: "bg-[#f4ecd8] text-[#5b4636]",
      header: "border-[#d4c4a8] bg-[#f4ecd8]/95",
      sheet: "bg-[#f4ecd8] text-[#5b4636] border-[#d4c4a8]",
      sheetText: "text-[#5b4636]",
      mutedText: "text-[#8b7355]",
      border: "bg-[#d4c4a8]",
      icon: "text-[#a89880]",
      contentText: "text-[#433422]",
      progressBar: "bg-[#8b6914]",
      highlightBg: "bg-[#d4c4a8]",
      highlightText: "text-[#8b6914]",
      skeleton: "bg-[#d4c4a8]",
    },
  }[readerTheme]
}

function getGroupPageForChapter(chapterNumber: number, pageSize: number) {
  return Math.max(1, Math.ceil(chapterNumber / pageSize))
}

interface ReadPageClientProps {
  params: Promise<{ id: string; chapter: string }>
  initialData?: PublicNovelReaderResponse
  initialError?: string | null
}

export function ReadPageClient({
  params,
  initialData,
  initialError,
}: ReadPageClientProps) {
  const { id, chapter } = use(params)
  const chapterNumber = useMemo(() => Number.parseInt(chapter, 10), [chapter])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, isLoading: isAuthLoading } = useAuth()

  const [fontSize, setFontSize] = useState(18)
  const [readerTheme, setReaderTheme] = useState<"light" | "dark" | "sepia">("light")
  const [isChapterListOpen, setIsChapterListOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFetching, setIsFetching] = useState(!initialData)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [data, setData] = useState<PublicNovelReaderResponse | null>(initialData ?? null)
  const [isBookmarked, setIsBookmarked] = useState(initialData?.viewer.isBookmarked ?? false)
  const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(
    initialData ? !initialData.chapter.isPaid || isChapterUnlocked(id, chapter) : true
  )
  const [openGroupPage, setOpenGroupPage] = useState<number | null>(null)
  const [loadingGroupPage, setLoadingGroupPage] = useState<number | null>(null)
  const [chapterGroupCache, setChapterGroupCache] = useState<
    Record<
      number,
      {
        chapters: PublicNovelChapterDto[]
        chapterList: PublicNovelChapterListDto
      }
    >
  >({})
  const chapterGroupRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const theme = getDefaultThemeStyles(readerTheme)
  const chapterPage = Number.parseInt(searchParams.get("chapterPage") ?? "", 10)
  const scrollRestored = useRef(false)
  const initialDataMatchesRoute = useMemo(() => {
    if (!initialData) {
      return false
    }

    return initialData.novel.id === id && initialData.chapter.number === chapterNumber
  }, [chapterNumber, id, initialData])

  // Clear cache when novel changes
  useEffect(() => {
    setOpenGroupPage(null)
    setLoadingGroupPage(null)
    setChapterGroupCache({})
    scrollRestored.current = false
  }, [id])

  // Load reader settings and restore scroll position
  useEffect(() => {
    try {
      const saved = localStorage.getItem(READER_SETTINGS_KEY)
      if (saved) {
        const settings = JSON.parse(saved) as {
          fontSize?: number
          readerTheme?: "light" | "dark" | "sepia"
        }

        if (settings.fontSize) {
          setFontSize(settings.fontSize)
        }
        if (settings.readerTheme) {
          setReaderTheme(settings.readerTheme)
        }
      }

      // Restore scroll position using numeric chapter number
      const progressKey = `${READING_PROGRESS_KEY}-${id}-${chapterNumber}`
      const savedProgress = localStorage.getItem(progressKey)
      if (savedProgress) {
        const parsed = JSON.parse(savedProgress) as { scrollY?: number; progress?: number }
        if (typeof parsed.scrollY === "number" && !scrollRestored.current) {
          scrollRestored.current = true
          setTimeout(() => {
            window.scrollTo({ top: parsed.scrollY ?? 0, behavior: "auto" })
          }, 100)
        }
        if (typeof parsed.progress === "number") {
          setReadingProgress(parsed.progress)
        }
      }
    } catch (loadError) {
      console.error("Failed to load reader settings:", loadError)
    } finally {
      setIsLoaded(true)
    }
  }, [chapterNumber, id])

  useEffect(() => {
    if (!initialDataMatchesRoute || !initialData) {
      return
    }

    setData(initialData)
    setError(initialError ?? null)
    setIsFetching(false)
    setIsBookmarked(initialData.viewer.isBookmarked)
    setIsUnlocked(
      initialData.chapter.isPaid ? isChapterUnlocked(id, String(initialData.chapter.number)) : true
    )
  }, [chapterNumber, id, initialData, initialDataMatchesRoute, initialError])

  useEffect(() => {
    let cancelled = false

    const loadChapter = async () => {
      setIsFetching(true)
      setError(null)
      setData(null)

      try {
        const payload = await fetchPublicNovelChapter(id, String(chapterNumber), {
          chapterPage:
            Number.isFinite(chapterPage) && chapterPage > 1 ? chapterPage : undefined,
        })
        if (cancelled) {
          return
        }

        setData(payload)
        setIsBookmarked(payload.viewer.isBookmarked)

        if (payload.chapter.isPaid) {
          setIsUnlocked(isChapterUnlocked(id, String(payload.chapter.number)))
        } else {
          setIsUnlocked(true)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load chapter")
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false)
        }
      }
    }

    if (!initialDataMatchesRoute) {
      void loadChapter()
    } else {
      setIsFetching(false)
    }

    return () => {
      cancelled = true
    }
  }, [chapterNumber, chapterPage, id, initialDataMatchesRoute])

  useEffect(() => {
    if (!data) {
      return
    }

    setIsBookmarked(data.viewer.isBookmarked)
    setOpenGroupPage(data.chapterList.currentPage)
    setChapterGroupCache((previous) => ({
      ...previous,
      [data.chapterList.currentPage]: {
        chapters: data.chapters,
        chapterList: data.chapterList,
      },
    }))
  }, [data])

  useEffect(() => {
    if (!isLoaded || !data || !data.chapter) {
      return
    }

    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0

      setReadingProgress(progress)

      try {
        // Use numeric chapter number for consistent keys
        localStorage.setItem(
          `${READING_PROGRESS_KEY}-${id}-${chapterNumber}`,
          JSON.stringify({
            scrollY,
            progress,
            timestamp: Date.now(),
          })
        )
      } catch (saveError) {
        console.error("Failed to save reading progress:", saveError)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [chapterNumber, data, id, isLoaded])

  useEffect(() => {
    const chapterNumberValue = data?.chapter.number
    if (isAuthLoading || !user || !chapterNumberValue) {
      return
    }

    const persistProgress = async () => {
      try {
        await updateReadingProgress({
          novelId: id,
          chapterNumber: chapterNumberValue,
          chapterId: data?.chapter.id ?? null,
        })
      } catch (persistError) {
        console.error("Failed to sync reading progress:", persistError)
      }
    }

    void persistProgress()
  }, [chapterNumber, data, id, isAuthLoading, user])

  // Keyboard navigation for chapters (arrow keys)
  useEffect(() => {
    if (!data || !data.chapter) {
      return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        !(target instanceof HTMLElement) ||
        target.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
        target.closest("[role='dialog'], a, button, input, select, textarea, [contenteditable='true']")
      ) {
        return
      }

      if (e.key === "ArrowLeft" && data.chapter?.previousChapterNumber) {
        e.preventDefault()
        const prevGroupPage = getGroupPageForChapter(
          data.chapter.previousChapterNumber,
          data.chapterList?.pageSize ?? 100
        )
        router.push(
          `/novel/${id}/read/${data.chapter.previousChapterNumber}?chapterPage=${prevGroupPage}`
        )
      } else if (e.key === "ArrowRight" && data.chapter?.nextChapterNumber) {
        e.preventDefault()
        const nextGroupPage = getGroupPageForChapter(
          data.chapter.nextChapterNumber,
          data.chapterList?.pageSize ?? 100
        )
        router.push(
          `/novel/${id}/read/${data.chapter.nextChapterNumber}?chapterPage=${nextGroupPage}`
        )
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [data, id, router])

  const toggleBookmark = useCallback(async () => {
    if (isAuthLoading || isBookmarkSubmitting) {
      return
    }

    if (!user) {
      router.push(buildSignInPath(pathname))
      return
    }

    try {
      setIsBookmarkSubmitting(true)
      const state = isBookmarked ? await removeBookmark(id) : await addBookmark(id)
      setIsBookmarked(state.isBookmarked)
    } catch (bookmarkError) {
      console.error("Failed to toggle bookmark:", bookmarkError)
    } finally {
      setIsBookmarkSubmitting(false)
    }
  }, [isAuthLoading, isBookmarkSubmitting, user, isBookmarked, id, pathname, router])

  const adjustFontSize = useCallback((delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 14), 24))
  }, [])

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(
          READER_SETTINGS_KEY,
          JSON.stringify({
            fontSize,
            readerTheme,
          })
        )
      } catch (saveError) {
        console.error("Failed to save reader settings:", saveError)
      }
    }
  }, [fontSize, isLoaded, readerTheme])

  const currentChapter = data?.chapter ?? null
  const chapterList = data?.chapterList ?? null
  const novel = data?.novel ?? null
  const novelSlug = novel?.slug ?? id
  const author = data?.author ?? null
  const authorPubkey = useMemo(() => (author ? npubToHex(author.npub) : null), [author])
  const chapterGroups = useMemo(() => {
    if (!chapterList) {
      return []
    }

    return Array.from({ length: chapterList.totalPages }, (_, index) => {
      const page = index + 1
      const start = (page - 1) * chapterList.pageSize + 1
      const end = Math.min(page * chapterList.pageSize, chapterList.maxChapterNumber)
      return {
        page,
        start,
        end,
      }
    })
  }, [chapterList])

  useEffect(() => {
    if (!isChapterListOpen || openGroupPage === null) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      chapterGroupRefs.current[openGroupPage]?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "smooth",
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isChapterListOpen, openGroupPage])

  // Loading skeleton for better perceived performance
  if (isFetching) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${theme.bg}`}>
        <header className={`sticky top-0 z-50 border-b ${theme.header} backdrop-blur-sm`}>
          <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
            <div className={`h-4 w-32 ${theme.skeleton} animate-pulse rounded`} />
            <div className="flex items-center gap-1">
              <div className={`h-8 w-8 ${theme.skeleton} animate-pulse rounded`} />
              <div className={`h-8 w-8 ${theme.skeleton} animate-pulse rounded`} />
              <div className={`h-8 w-8 ${theme.skeleton} animate-pulse rounded`} />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-12 text-center">
            <div className={`mx-auto h-4 w-24 ${theme.skeleton} animate-pulse rounded`} />
            <div className={`mx-auto mt-4 h-8 w-3/4 ${theme.skeleton} animate-pulse rounded`} />
            <div className={`mx-auto mt-3 h-4 w-40 ${theme.skeleton} animate-pulse rounded`} />
          </div>
          <div className="space-y-4">
            <div className={`h-4 w-full ${theme.skeleton} animate-pulse rounded`} />
            <div className={`h-4 w-full ${theme.skeleton} animate-pulse rounded`} />
            <div className={`h-4 w-5/6 ${theme.skeleton} animate-pulse rounded`} />
            <div className={`h-4 w-full ${theme.skeleton} animate-pulse rounded`} />
            <div className={`h-4 w-4/5 ${theme.skeleton} animate-pulse rounded`} />
          </div>
        </main>
      </div>
    )
  }

  // Error state with retry mechanism
  if (error || !data || !currentChapter || !novel || !author) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 transition-colors duration-300 ${theme.bg}`}>
        <div className="max-w-md rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-sm">
          <p className="font-serif text-2xl text-foreground">Chapter unavailable</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {error || "We could not load this chapter right now."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => window.location.reload()}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/novel/${novelSlug}`}>Back to Novel</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const chapterHtml = currentChapter.contentHtml || "<p>This chapter has not been published yet.</p>"
  const chapterPrice = currentChapter.priceSats ?? 0
  const isPaidChapter = Boolean(currentChapter.isPaid && chapterPrice > 0)

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme.bg}`}>
      <header className={`sticky top-0 z-50 border-b ${theme.header} backdrop-blur-sm`}>
        {/* Progress bar with accessibility attributes */}
        <div className="h-0.5 w-full bg-transparent">
          <div
            role="progressbar"
            aria-label="Reading progress"
            aria-valuenow={Math.round(readingProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-full transition-all duration-150 ${theme.progressBar}`}
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild aria-label="Back to novel">
              <Link href={`/novel/${novelSlug}`}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="hidden sm:block">
              <p className="text-sm font-medium line-clamp-1">{novel.title}</p>
              <p className={`text-xs ${theme.mutedText}`}>Chapter {currentChapter.number}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Sheet open={isChapterListOpen} onOpenChange={setIsChapterListOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open chapter list">
                  <List className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Chapters</SheetTitle>
                  <SheetDescription className={theme.mutedText}>
                    Browse all chapters in this novel
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto px-1 pb-6">
                  {chapterGroups.map((group) => {
                    const isCurrentGroup = chapterList?.currentPage === group.page
                    const isOpen = openGroupPage === group.page
                    const isLoading = loadingGroupPage === group.page
                    const groupData = chapterGroupCache[group.page] ?? null
                    const sortedGroupChapters = groupData
                      ? [...groupData.chapters].sort((a, b) => a.number - b.number)
                      : []

                    return (
                      <div
                        key={group.page}
                        ref={(node) => {
                          chapterGroupRefs.current[group.page] = node
                        }}
                        className="overflow-hidden rounded-xl border border-border/40"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isOpen) {
                              setOpenGroupPage(null)
                              return
                            }

                            setOpenGroupPage(group.page)

                            if (chapterGroupCache[group.page]) {
                              return
                            }

                            setLoadingGroupPage(group.page)
                            void fetchPublicNovelDetail(id, {
                              chapterPage: group.page,
                            })
                              .then((payload) => {
                                setChapterGroupCache((previous) => ({
                                  ...previous,
                                  [group.page]: {
                                    chapters: payload.chapters,
                                    chapterList: payload.chapterList,
                                  },
                                }))
                              })
                              .catch((error) => {
                                console.error("Failed to load chapter group:", error)
                              })
                              .finally(() => {
                                setLoadingGroupPage((previous) =>
                                  previous === group.page ? null : previous
                                )
                              })
                          }}
                          disabled={isLoading}
                          aria-expanded={isOpen}
                          aria-label={`Chapters ${group.start.toLocaleString()} to ${group.end.toLocaleString()}`}
                          className={`flex w-full items-center justify-between gap-3 px-3 py-3 text-left text-sm transition-colors ${
                            isCurrentGroup
                              ? theme.highlightBg
                              : `${theme.mutedText} hover:opacity-80`
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {group.start.toLocaleString()}-{group.end.toLocaleString()}
                            </p>
                            {isCurrentGroup && (
                              <span className={`rounded-full px-2 py-0.5 text-xs ${theme.highlightBg} ${theme.highlightText}`}>
                                Current
                              </span>
                            )}
                            {isLoading && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        {isOpen ? (
                          <div className="border-t border-border/30">
                            {sortedGroupChapters.length === 0 && !isLoading ? (
                              <div className={`px-3 py-4 text-sm ${theme.mutedText}`}>
                                Unable to load chapters right now.
                              </div>
                            ) : isLoading ? (
                              <div className={`px-3 py-4 text-sm ${theme.mutedText}`}>
                                Loading chapters...
                              </div>
                            ) : (
                              <div className="space-y-1 px-2 pb-2">
                                {sortedGroupChapters.map((ch) => {
                                  const isCurrentChapter = ch.number === currentChapter.number
                                  return (
                                    <Link
                                      key={ch.id}
                                      href={`/novel/${novelSlug}/read/${ch.number}?chapterPage=${group.page}`}
                                      onClick={() => setIsChapterListOpen(false)}
                                      aria-label={`Chapter ${ch.number}: ${ch.title}`}
                                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                        isCurrentChapter
                                          ? theme.highlightBg
                                          : `${theme.mutedText} hover:opacity-80`
                                      }`}
                                    >
                                      <span
                                        className={`text-xs font-medium ${
                                          isCurrentChapter ? theme.highlightText : ""
                                        }`}
                                      >
                                        {ch.number}
                                      </span>
                                      <span
                                        className={`line-clamp-1 ${
                                          isCurrentChapter ? theme.highlightText : ""
                                        }`}
                                      >
                                        {ch.title}
                                      </span>
                                      {ch.isPaid && ch.priceSats ? (
                                        <span className="ml-auto text-xs opacity-80">
                                          {ch.priceSats} sats
                                        </span>
                                      ) : null}
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
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="icon"
              disabled={isBookmarkSubmitting}
              onClick={() => void toggleBookmark()}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              {isBookmarkSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open reading settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Reading Settings</SheetTitle>
                  <SheetDescription className={theme.mutedText}>
                    Customize your reading experience
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6 px-2">
                  <div>
                    <label
                      id="font-size-label"
                      className="text-sm font-medium"
                    >
                      Font Size
                    </label>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(-2)}
                        disabled={fontSize <= 14}
                        aria-label="Decrease font size"
                        aria-labelledby="font-size-label"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span
                        className="w-12 text-center text-sm"
                        aria-live="polite"
                      >
                        {fontSize}px
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(2)}
                        disabled={fontSize >= 24}
                        aria-label="Increase font size"
                        aria-labelledby="font-size-label"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label id="theme-label" className="text-sm font-medium">
                      Theme
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={readerTheme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("light")}
                        aria-label="Light theme"
                        aria-pressed={readerTheme === "light"}
                        className={readerTheme === "light" ? "ring-2 ring-primary ring-offset-2" : ""}
                      >
                        <Sun className="mr-2 h-4 w-4" />
                        Light
                        {readerTheme === "light" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={readerTheme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("dark")}
                        aria-label="Dark theme"
                        aria-pressed={readerTheme === "dark"}
                        className={
                          readerTheme === "dark"
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-[#1a1a1a]"
                            : ""
                        }
                      >
                        <Moon className="mr-2 h-4 w-4" />
                        Dark
                        {readerTheme === "dark" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={readerTheme === "sepia" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("sepia")}
                        aria-label="Sepia theme"
                        aria-pressed={readerTheme === "sepia"}
                        className={readerTheme === "sepia" ? "ring-2 ring-primary ring-offset-2" : ""}
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        Sepia
                        {readerTheme === "sepia" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" asChild aria-label="Go to home page">
              <Link href="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 pb-24 sm:px-6 sm:py-16">
        <header className="mb-12 text-center">
          <p className={`text-sm ${theme.mutedText}`}>Chapter {currentChapter.number}</p>
          <h1 className="mt-2 font-serif text-3xl font-light tracking-tight sm:text-4xl">
            {currentChapter.title}
          </h1>
          <p className={`mt-3 text-sm ${theme.mutedText}`}>
            {currentChapter.wordCount.toLocaleString()} words
            {currentChapter.publishedAt ? ` · ${new Date(currentChapter.publishedAt).toLocaleDateString()}` : ""}
          </p>
        </header>

        {isPaidChapter && !isUnlocked ? (
          authorPubkey ? (
            <ZapPaywall
              novelId={id}
              chapterId={String(currentChapter.number)}
              chapterTitle={currentChapter.title}
              chapterNumber={currentChapter.number}
              amountSats={chapterPrice}
              recipientPubkey={authorPubkey}
              recipientLud16={author.lud16 ?? undefined}
              onUnlocked={() => {
                setIsUnlocked(true)
                storeZapReceipt(id, String(currentChapter.number))
              }}
              theme={{
                bg: theme.bg,
                mutedText: theme.mutedText,
                border: theme.border,
              }}
            />
          ) : (
            <div className="rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-sm">
              <p className="font-medium text-foreground">Payment unavailable</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                This chapter is locked, but the author&apos;s payment details are not available
                right now. Please try again later.
              </p>
            </div>
          )
        ) : (
          <article
            className="prose prose-neutral max-w-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            <div
              className={`[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_h1]:font-serif [&_h1]:text-2xl [&_h1]:font-medium [&_h2]:font-serif [&_h2]:text-xl [&_h2]:font-medium [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 ${theme.contentText}`}
              dangerouslySetInnerHTML={{ __html: chapterHtml }}
            />
          </article>
        )}

        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-3">
            <span className={`h-px w-12 ${theme.border}`} />
            <BookOpen className={`h-5 w-5 ${theme.icon}`} />
            <span className={`h-px w-12 ${theme.border}`} />
          </div>
        </div>
      </main>

      <footer className={`fixed inset-x-0 bottom-0 border-t ${theme.header} bg-opacity-95 backdrop-blur-sm`}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          {currentChapter.previousChapterNumber ? (
            <Button
              variant="ghost"
              asChild
              aria-label={`Go to previous chapter`}
              title="Previous chapter (←)"
            >
              <Link
                href={`/novel/${novelSlug}/read/${currentChapter.previousChapterNumber}?chapterPage=${getGroupPageForChapter(
                  currentChapter.previousChapterNumber,
                  chapterList?.pageSize ?? 100
                )}`}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex flex-col items-center gap-1">
            <span className={`text-sm ${theme.mutedText}`}>
              {currentChapter.number} / {novel.chaptersCount}
            </span>
            {readingProgress > 0 ? (
              <span className={`text-xs ${theme.mutedText}`}>
                {Math.round(readingProgress)}% read
              </span>
            ) : null}
          </div>

          {currentChapter.nextChapterNumber ? (
            <Button
              variant="ghost"
              asChild
              aria-label={`Go to next chapter`}
              title="Next chapter (→)"
            >
              <Link
                href={`/novel/${novelSlug}/read/${currentChapter.nextChapterNumber}?chapterPage=${getGroupPageForChapter(
                  currentChapter.nextChapterNumber,
                  chapterList?.pageSize ?? 100
                )}`}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild aria-label="Finish chapter">
              <Link href={`/novel/${novelSlug}`}>
                <span className="hidden sm:inline">Finish</span>
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
