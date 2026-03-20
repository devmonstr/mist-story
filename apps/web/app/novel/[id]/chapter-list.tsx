"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Lock } from "lucide-react"
import {
  type PublicNovelChapterDto,
  type PublicNovelDetailDto,
} from "@mist/shared"
import { isChapterUnlocked } from "@/lib/zap-utils"
import { formatPublishedDate } from "./novel-utils"

interface ChapterListProps {
  novel: PublicNovelDetailDto
  chapters: PublicNovelChapterDto[]
}

export function ChapterList({ novel, chapters }: ChapterListProps) {
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unlocked = new Set<string>()

    for (const chapter of chapters) {
      if (isChapterUnlocked(novel.id, String(chapter.number))) {
        unlocked.add(String(chapter.number))
      }
    }

    setUnlockedSet(unlocked)
  }, [chapters, novel.id])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Chapters</h2>
        <span className="text-sm text-muted-foreground">
          {chapters.length} chapters
        </span>
      </div>

      {chapters.length === 0 ? (
        <div className="mt-6 text-sm text-muted-foreground">
          No published chapters yet.
        </div>
      ) : (
        <div className="mt-6 divide-y divide-border/40">
          {chapters.map((chapter) => {
            const isPaid = chapter.isPaid && Boolean(chapter.priceSats)
            const isUnlocked = !isPaid || unlockedSet.has(String(chapter.number))

            return (
              <Link
                key={chapter.id}
                href={`/novel/${novel.slug}/read/${chapter.number}`}
                className="group flex items-center justify-between py-4 transition-colors hover:bg-muted/30"
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
      )}
    </div>
  )
}
