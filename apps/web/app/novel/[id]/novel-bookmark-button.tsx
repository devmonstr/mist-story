"use client"

import { useEffect, useState } from "react"
import { BookmarkCheck, Loader2, Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { buildSignInPath } from "@/lib/auth-routes"
import {
  addBookmark,
  fetchBookmarkState,
  removeBookmark,
} from "@/lib/api"
import { usePathname, useRouter } from "next/navigation"

interface NovelBookmarkButtonProps {
  novelId: string
  initialIsBookmarked?: boolean
}

export function NovelBookmarkButton({
  novelId,
  initialIsBookmarked = false,
}: NovelBookmarkButtonProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (!user) {
      setIsBookmarked(false)
      setIsLoaded(true)
      return
    }

    let cancelled = false

    const loadBookmarkState = async () => {
      try {
        const state = await fetchBookmarkState(novelId)
        if (!cancelled) {
          setIsBookmarked(state.isBookmarked)
        }
      } catch {
        if (!cancelled) {
          setIsBookmarked(false)
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true)
        }
      }
    }

    void loadBookmarkState()

    return () => {
      cancelled = true
    }
  }, [isLoading, novelId, user])

  const handleToggleBookmark = async () => {
    if (isLoading) {
      return
    }

    if (!user) {
      router.push(buildSignInPath(pathname))
      return
    }

    try {
      setIsSubmitting(true)
      const state = isBookmarked
        ? await removeBookmark(novelId)
        : await addBookmark(novelId)
      setIsBookmarked(state.isBookmarked)
    } catch (error) {
      console.error("Failed to toggle bookmark:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => void handleToggleBookmark()}
      disabled={isSubmitting || !isLoaded}
      className="min-w-[160px]"
    >
      {isSubmitting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="mr-2 h-4 w-4" />
      ) : (
        <Bookmark className="mr-2 h-4 w-4" />
      )}
      {isBookmarked ? "In Library" : "Add to Library"}
    </Button>
  )
}
