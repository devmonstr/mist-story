"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Lock } from "lucide-react"
import { isChapterUnlocked } from "@/lib/zap-utils"

const novels: Record<string, {
  id: string
  chapters: {
    id: number
    title: string
    publishedDate: string
    wordCount: number
    /** sats required to unlock; undefined = free */
    price?: number
  }[]
}> = {
  "1": {
    id: "1",
    chapters: [
      { id: 1, title: "The Discovery", publishedDate: "Mar 15, 2024", wordCount: 4200 },
      { id: 2, title: "Whispers in the Archives", publishedDate: "Mar 22, 2024", wordCount: 3800 },
      { id: 3, title: "The Awakening", publishedDate: "Mar 29, 2024", wordCount: 4500, price: 10 },
      { id: 4, title: "Shadows of the Past", publishedDate: "Apr 5, 2024", wordCount: 4100, price: 10 },
      { id: 5, title: "The Disgraced Knight", publishedDate: "Apr 12, 2024", wordCount: 3900, price: 10 },
      { id: 6, title: "Secrets Unveiled", publishedDate: "Apr 19, 2024", wordCount: 4300, price: 10 },
      { id: 7, title: "The Journey Begins", publishedDate: "Apr 26, 2024", wordCount: 4000, price: 10 },
      { id: 8, title: "Into the Elderwood", publishedDate: "May 3, 2024", wordCount: 4600, price: 10 },
      { id: 9, title: "The Ancient Temple", publishedDate: "May 10, 2024", wordCount: 4200, price: 10 },
      { id: 10, title: "Bonds of Trust", publishedDate: "May 17, 2024", wordCount: 3700, price: 10 },
    ],
  },
}

const defaultNovel = novels["1"]

export function ChapterList({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  // Track unlocked chapters client-side
  const [unlockedSet, setUnlockedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    const unlocked = new Set<string>()
    for (const ch of novel.chapters) {
      if (isChapterUnlocked(novel.id, String(ch.id))) {
        unlocked.add(String(ch.id))
      }
    }
    setUnlockedSet(unlocked)
  }, [novel])

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Chapters</h2>
        <span className="text-sm text-muted-foreground">
          {novel.chapters.length} chapters
        </span>
      </div>

      <div className="mt-6 divide-y divide-border/40">
        {novel.chapters.map((chapter) => {
          const isPaid = !!chapter.price
          const isUnlocked = !isPaid || unlockedSet.has(String(chapter.id))

          return (
            <Link
              key={chapter.id}
              href={`/novel/${novel.id}/read/${chapter.id}`}
              className="group flex items-center justify-between py-4 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {chapter.id}
                </span>
                <div>
                  <p className="font-medium text-foreground group-hover:text-foreground/80">
                    {chapter.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {chapter.publishedDate} · {chapter.wordCount.toLocaleString()} words
                    {isPaid && !isUnlocked && (
                      <span className="ml-2 inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                        <Lock className="h-3 w-3" />
                        {chapter.price} sats
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPaid && !isUnlocked && (
                  <Lock className="h-4 w-4 text-muted-foreground/60" />
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
