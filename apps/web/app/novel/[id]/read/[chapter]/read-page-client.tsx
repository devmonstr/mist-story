"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
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
  Minus,
  Moon,
  Plus,
  Settings,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import { buildSignInPath } from "@/lib/auth-routes"
import {
  addBookmark,
  fetchPublicNovelChapter,
  removeBookmark,
  updateReadingProgress,
} from "@/lib/api"
import { npubToHex } from "@/lib/nostr-utils"
import { ZapPaywall } from "@/components/zap-paywall"
import { isChapterUnlocked, storeZapReceipt } from "@/lib/zap-utils"
import { type PublicNovelReaderResponse } from "@mist/shared"

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
    },
  }[readerTheme]
}

export function ReadPageClient({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>
}) {
  const { id, chapter } = use(params)
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading: isAuthLoading } = useAuth()

  const [fontSize, setFontSize] = useState(18)
  const [readerTheme, setReaderTheme] = useState<"light" | "dark" | "sepia">("light")
  const [isChapterListOpen, setIsChapterListOpen] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<PublicNovelReaderResponse | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isBookmarkSubmitting, setIsBookmarkSubmitting] = useState(false)
  const [readingProgress, setReadingProgress] = useState(0)
  const [isUnlocked, setIsUnlocked] = useState(true)
  const theme = getDefaultThemeStyles(readerTheme)

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

      const progress = localStorage.getItem(`${READING_PROGRESS_KEY}-${id}-${chapter}`)
      if (progress) {
        const parsed = JSON.parse(progress) as { scrollY?: number; progress?: number }
        if (typeof parsed.scrollY === "number") {
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
  }, [chapter, id])

  useEffect(() => {
    let cancelled = false

    const loadChapter = async () => {
      setIsFetching(true)
      setError(null)

      try {
        const payload = await fetchPublicNovelChapter(id, chapter)
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

    void loadChapter()

    return () => {
      cancelled = true
    }
  }, [chapter, id])

  useEffect(() => {
    if (!data) {
      return
    }

    setIsBookmarked(data.viewer.isBookmarked)
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
        localStorage.setItem(
          `${READING_PROGRESS_KEY}-${id}-${chapter}`,
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
  }, [chapter, data, id, isLoaded])

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
  }, [chapter, data, id, isAuthLoading, user])

  const toggleBookmark = async () => {
    if (isAuthLoading) {
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
  }

  const adjustFontSize = (delta: number) => {
    setFontSize((prev) => Math.min(Math.max(prev + delta, 14), 24))
  }

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

  const chapters = data?.chapters ?? []
  const currentChapter = data?.chapter ?? null
  const novel = data?.novel ?? null
  const author = data?.author ?? null
  const authorPubkey = useMemo(() => (author ? npubToHex(author.npub) : null), [author])

  if (isFetching) {
    return (
      <div className={`flex min-h-screen items-center justify-center transition-colors ${theme.bg}`}>
        <div className="flex items-center gap-3 text-muted-foreground">
          <BookOpen className="h-5 w-5 animate-pulse" />
          <span>Loading chapter...</span>
        </div>
      </div>
    )
  }

  if (error || !data || !currentChapter || !novel || !author) {
    return (
      <div className={`flex min-h-screen items-center justify-center px-4 transition-colors ${theme.bg}`}>
        <div className="max-w-md rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-sm">
          <p className="font-serif text-2xl text-foreground">Chapter unavailable</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {error || "We could not load this chapter right now."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild>
              <Link href={`/novel/${id}`}>Back to Novel</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/library">Browse Library</Link>
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
    <div className={`min-h-screen transition-colors ${theme.bg}`}>
      <header className={`sticky top-0 z-50 border-b ${theme.header} backdrop-blur-sm`}>
        <div className="h-0.5 w-full bg-transparent">
          <div
            className="h-full bg-primary transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>

        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/novel/${id}`}>
                <ChevronLeft className="h-5 w-5" />
                <span className="sr-only">Back to novel</span>
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
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
                  <span className="sr-only">Chapter list</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Chapters</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  {chapters.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/novel/${id}/read/${ch.number}`}
                      onClick={() => setIsChapterListOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        ch.number === currentChapter.number
                          ? readerTheme === "light"
                            ? "bg-muted text-foreground"
                            : "bg-[#333] text-white"
                          : `${theme.mutedText} hover:opacity-80`
                      }`}
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                        {ch.number}
                      </span>
                      <span className="line-clamp-1">{ch.title}</span>
                      {ch.isPaid && ch.priceSats ? (
                        <span className="ml-auto text-xs opacity-80">{ch.priceSats} sats</span>
                      ) : null}
                    </Link>
                  ))}
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
              {isBookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Reading settings</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={theme.sheet}>
                <SheetHeader>
                  <SheetTitle className={theme.sheetText}>Reading Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6 px-2">
                  <div>
                    <label
                      className="text-sm font-medium"
                      style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                    >
                      Font Size
                    </label>
                    <div className="mt-3 flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(-2)}
                        disabled={fontSize <= 14}
                        style={
                          readerTheme === "dark"
                            ? { borderColor: "#444", color: "#e0e0e0", backgroundColor: "#1a1a1a" }
                            : {}
                        }
                      >
                        <Minus
                          className="h-4 w-4"
                          style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                        />
                      </Button>
                      <span
                        className="w-12 text-center text-sm"
                        style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                      >
                        {fontSize}px
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => adjustFontSize(2)}
                        disabled={fontSize >= 24}
                        style={
                          readerTheme === "dark"
                            ? { borderColor: "#444", color: "#e0e0e0", backgroundColor: "#1a1a1a" }
                            : {}
                        }
                      >
                        <Plus
                          className="h-4 w-4"
                          style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                        />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label
                      className="text-sm font-medium"
                      style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                    >
                      Theme
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant={readerTheme === "light" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("light")}
                        style={
                          readerTheme === "dark"
                            ? { borderColor: "#444", color: "#e0e0e0", backgroundColor: "#1a1a1a" }
                            : {}
                        }
                        className={readerTheme === "light" ? "ring-2 ring-primary ring-offset-2" : ""}
                      >
                        <Sun
                          className="mr-2 h-4 w-4"
                          style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                        />
                        Light
                        {readerTheme === "light" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={readerTheme === "dark" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("dark")}
                        style={
                          readerTheme !== "dark"
                            ? { borderColor: "#444", color: "#e0e0e0", backgroundColor: "#1a1a1a" }
                            : { borderColor: "#666", backgroundColor: "#2a2a2a" }
                        }
                        className={
                          readerTheme === "dark"
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-[#1a1a1a]"
                            : ""
                        }
                      >
                        <Moon
                          className="mr-2 h-4 w-4"
                          style={{ color: readerTheme !== "dark" ? "#e0e0e0" : "" }}
                        />
                        Dark
                        {readerTheme === "dark" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                      <Button
                        variant={readerTheme === "sepia" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setReaderTheme("sepia")}
                        style={
                          readerTheme === "dark"
                            ? { borderColor: "#444", color: "#e0e0e0", backgroundColor: "#1a1a1a" }
                            : {}
                        }
                        className={readerTheme === "sepia" ? "ring-2 ring-primary ring-offset-2" : ""}
                      >
                        <Coffee
                          className="mr-2 h-4 w-4"
                          style={{ color: readerTheme === "dark" ? "#e0e0e0" : "" }}
                        />
                        Sepia
                        {readerTheme === "sepia" && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
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

      <footer className={`sticky bottom-0 border-t ${theme.header} backdrop-blur-sm`}>
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          {currentChapter.previousChapterNumber ? (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}/read/${currentChapter.previousChapterNumber}`}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Link>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex flex-col items-center gap-1">
            <span className={`text-sm ${theme.mutedText}`}>
              {currentChapter.number} / {chapters.length}
            </span>
            {readingProgress > 0 ? (
              <span className={`text-xs ${theme.mutedText}`}>
                {Math.round(readingProgress)}% read
              </span>
            ) : null}
          </div>

          {currentChapter.nextChapterNumber ? (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}/read/${currentChapter.nextChapterNumber}`}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild>
              <Link href={`/novel/${id}`}>
                Finish
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
