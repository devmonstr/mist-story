import type { ReactNode } from "react"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

type NovelCardProps = {
  href: string
  title: string
  coverSrc?: string | null
  coverAlt?: string
  authorName: string
  authorHref?: string
  summary?: string | null
  summaryFallback?: string
  titleAside?: ReactNode
  meta?: ReactNode
  afterSummary?: ReactNode
  footer?: ReactNode
  coverOverlay?: ReactNode
  className?: string
  contentClassName?: string
}

export function NovelCard({
  href,
  title,
  coverSrc,
  coverAlt,
  authorName,
  authorHref,
  summary,
  summaryFallback = "A new story is waiting to be explored.",
  titleAside,
  meta,
  afterSummary,
  footer,
  coverOverlay,
  className,
  contentClassName,
}: NovelCardProps) {
  const resolvedSummary = summary?.trim() || summaryFallback

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden border border-border bg-card transition-colors hover:border-foreground",
        className
      )}
    >
      <div className="relative border-b border-border bg-muted/20">
        <Link href={href} className="block">
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              alt={coverAlt ?? `${title} cover`}
              className="aspect-[3/4] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted/40 text-muted-foreground">
              <BookOpen className="h-8 w-8" />
            </div>
          )}
        </Link>

        {coverOverlay ? <div className="absolute right-3 top-3">{coverOverlay}</div> : null}
      </div>

      <div className={cn("flex flex-1 flex-col p-4", contentClassName)}>
        <div className="flex-1">
          <div className="mb-3 flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 font-serif text-lg font-medium text-foreground">
              <Link href={href} className="hover:underline">
                {title}
              </Link>
            </h3>
            {titleAside ? (
              <div className="flex flex-shrink-0 flex-col items-end gap-2">{titleAside}</div>
            ) : null}
          </div>

          <p className="mb-3 text-sm text-muted-foreground">
            by{" "}
            {authorHref ? (
              <Link href={authorHref} className="font-medium hover:underline">
                {authorName}
              </Link>
            ) : (
              <span className="font-medium">{authorName}</span>
            )}
          </p>

          {meta ? <div className="mb-3 text-xs text-muted-foreground">{meta}</div> : null}

          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-foreground/80">
            {resolvedSummary}
          </p>

          {afterSummary}
        </div>

        {footer}
      </div>
    </article>
  )
}
