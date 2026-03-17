import { use } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const novels: Record<string, {
  id: string
  chapters: { id: number; title: string; publishedDate: string; wordCount: number }[]
}> = {
  "1": {
    id: "1",
    chapters: [
      { id: 1, title: "The Discovery", publishedDate: "Mar 15, 2024", wordCount: 4200 },
      { id: 2, title: "Whispers in the Archives", publishedDate: "Mar 22, 2024", wordCount: 3800 },
      { id: 3, title: "The Awakening", publishedDate: "Mar 29, 2024", wordCount: 4500 },
      { id: 4, title: "Shadows of the Past", publishedDate: "Apr 5, 2024", wordCount: 4100 },
      { id: 5, title: "The Disgraced Knight", publishedDate: "Apr 12, 2024", wordCount: 3900 },
      { id: 6, title: "Secrets Unveiled", publishedDate: "Apr 19, 2024", wordCount: 4300 },
      { id: 7, title: "The Journey Begins", publishedDate: "Apr 26, 2024", wordCount: 4000 },
      { id: 8, title: "Into the Elderwood", publishedDate: "May 3, 2024", wordCount: 4600 },
      { id: 9, title: "The Ancient Temple", publishedDate: "May 10, 2024", wordCount: 4200 },
      { id: 10, title: "Bonds of Trust", publishedDate: "May 17, 2024", wordCount: 3700 },
    ],
  },
}

const defaultNovel = novels["1"]

export function ChapterList({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Chapters</h2>
        <span className="text-sm text-muted-foreground">
          {novel.chapters.length} chapters
        </span>
      </div>

      <div className="mt-6 divide-y divide-border/40">
        {novel.chapters.map((chapter) => (
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
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  )
}
