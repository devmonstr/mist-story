"use client"

import { useEffect, useRef, useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { buildCanonicalUrl } from "@/lib/site-url"

interface NovelShareButtonProps {
  novelSlug: string
  novelTitle: string
  novelSummary: string
  authorName: string
  genre: string
  status: string
  workType: string
}

function buildNovelUrl(novelSlug: string) {
  return buildCanonicalUrl(`/novel/${novelSlug}`).toString()
}

function buildShareText(input: {
  novelTitle: string
  novelSummary: string
  authorName: string
  genre: string
  status: string
  workType: string
}) {
  const summary = input.novelSummary.trim()
  const shortSummary =
    summary.length > 140 ? `${summary.slice(0, 137).trimEnd()}...` : summary
  const meta = [input.genre, input.workType, input.status].filter(Boolean).join(" · ")

  if (shortSummary) {
    return `"${input.novelTitle}" by ${input.authorName}\n${meta}\n\n${shortSummary}`
  }

  return `"${input.novelTitle}" by ${input.authorName}\n${meta}`
}

export function NovelShareButton({
  novelSlug,
  novelTitle,
  novelSummary,
  authorName,
  genre,
  status,
  workType,
}: NovelShareButtonProps) {
  const { toast } = useToast()
  const [isSharing, setIsSharing] = useState(false)
  const [isFallbackOpen, setIsFallbackOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const url = buildNovelUrl(novelSlug)

  useEffect(() => {
    if (!isFallbackOpen || !inputRef.current) {
      return
    }

    window.setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
      inputRef.current?.setSelectionRange(0, url.length)
    }, 20)
  }, [isFallbackOpen, url])

  const copyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.select()
        inputRef.current.setSelectionRange(0, url.length)
        document.execCommand("copy")
      }

      setCopied(true)
      toast({
        title: "Link copied",
        description: "The novel link is ready to share.",
      })
    } catch (error) {
      console.error("Failed to copy novel link:", error)
      toast({
        title: "Unable to copy automatically",
        description: "Tap the link field, then copy it manually.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (isSharing) {
      return
    }

    const shareData = {
      title: novelTitle,
      text: buildShareText({
        novelTitle,
        novelSummary,
        authorName,
        genre,
        status,
        workType,
      }),
      url,
    }

    try {
      setIsSharing(true)

      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare(shareData))
      ) {
        await navigator.share(shareData)
        toast({
          title: "Shared",
          description: "Thanks for sharing this story.",
        })
        return
      }

      setCopied(false)
      setIsFallbackOpen(true)
    } catch (error) {
      const isAbortError =
        error instanceof DOMException && error.name === "AbortError"

      if (!isAbortError) {
        console.error("Failed to share novel:", error)
        toast({
          title: "Unable to share",
          description: "Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="lg"
        type="button"
        onClick={() => void handleShare()}
        disabled={isSharing}
      >
        <Share2 className="mr-2 h-4 w-4" />
        {isSharing ? "Sharing..." : "Share"}
      </Button>
      <Dialog
        open={isFallbackOpen}
        onOpenChange={(open) => {
          setIsFallbackOpen(open)
          if (!open) {
            setCopied(false)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this story</DialogTitle>
            <DialogDescription>
              Copy the link below and send it anywhere you like.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              ref={inputRef}
              value={url}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
              onClick={(event) => event.currentTarget.select()}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFallbackOpen(false)}
            >
              Close
            </Button>
            <Button type="button" onClick={() => void copyLink()}>
              {copied ? "Copied" : "Copy link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
