import { BookOpen, Clock, Eye, Heart, BookmarkPlus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { type PublicNovelAuthorDto, type PublicNovelDetailDto, type PublicNovelViewerStateDto } from "@mist/shared"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { NovelBookmarkButton } from "./novel-bookmark-button"
import { NovelShareButton } from "./novel-share-button"

interface NovelHeaderProps {
  novel: PublicNovelDetailDto
  author: PublicNovelAuthorDto
  viewer: PublicNovelViewerStateDto
}

export function NovelHeader({ novel, author, viewer }: NovelHeaderProps) {
  const coverSrc = resolveNovelCoverSrc({
    novelId: novel.id,
    coverUrl: novel.coverUrl,
    coverStorageKey: novel.coverStorageKey,
  })

  const startChapterNumber = viewer.currentChapterNumber ?? 1
  const likesCount = novel.ratingsCount
  const workTypeLabel = novel.workType === "TRANSLATION" ? "Translation" : "Original"
  const hasTranslator = novel.workType === "TRANSLATION" && novel.translatorName.trim().length > 0

  return (
    <section className="border-b border-border/40 bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="flex justify-center lg:justify-start">
            <div className="flex aspect-[2/3] w-full max-w-[280px] items-center justify-center border border-border bg-card">
              {coverSrc ? (
                <Image
                  src={coverSrc}
                  alt={`${novel.title} cover`}
                  width={560}
                  height={840}
                  sizes="(min-width: 1024px) 280px, 70vw"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-6 text-center">
                  <div>
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 font-serif text-lg text-muted-foreground">
                      {novel.title}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {novel.genre}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {workTypeLabel}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {novel.status}
              </span>
            </div>

            <h1 className="mt-4 font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {novel.title}
            </h1>

            <p className="mt-3 text-lg text-muted-foreground">
              by <span className="font-medium text-foreground">{author.displayName}</span>
            </p>
            {hasTranslator ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Translated by{" "}
                <span className="font-medium text-foreground">{novel.translatorName}</span>
              </p>
            ) : null}

            <p className="mt-6 text-base leading-relaxed text-foreground/80">
              {novel.summary || "This story does not have a summary yet."}
            </p>
            {novel.updateNote ? (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Author note:</span>{" "}
                {novel.updateNote}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{novel.readsCount.toLocaleString()} reads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4" />
                <span>{novel.chaptersCount.toLocaleString()} chapters</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>{likesCount.toLocaleString()} likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4" />
                <span>{novel.bookmarksCount.toLocaleString()} bookmarks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{novel.estimatedReadMinutes} min read</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/novel/${novel.slug}/read/${startChapterNumber}`}>
                  {viewer.currentChapterNumber ? "Continue Reading" : "Start Reading"}
                </Link>
              </Button>
              <NovelBookmarkButton
                novelId={novel.id}
                initialIsBookmarked={viewer.isBookmarked}
              />
              <NovelShareButton
                novelSlug={novel.slug}
                novelTitle={novel.title}
                novelSummary={novel.summary}
                authorName={author.displayName}
                genre={novel.genre}
                status={novel.status}
                workType={workTypeLabel}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
