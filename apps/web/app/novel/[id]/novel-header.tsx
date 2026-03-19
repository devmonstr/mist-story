import { use } from "react"
import { BookOpen, Eye, Heart, BookmarkPlus, Clock, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Sample novel data
const novels: Record<string, {
  id: string
  title: string
  author: string
  genre: string
  status: string
  description: string
  chapters: { id: number; title: string; publishedDate: string; wordCount: number }[]
  stats: { reads: number; likes: number; bookmarks: number }
}> = {
  "1": {
    id: "1",
    title: "The Forgotten Kingdom",
    author: "Emma Stone",
    genre: "Fantasy",
    status: "Ongoing",
    description: "An epic tale of magic, adventure, and redemption across forgotten realms.",
    chapters: [
      { id: 1, title: "The Discovery", publishedDate: "Mar 15, 2024", wordCount: 4200 },
      { id: 2, title: "Whispers in the Archives", publishedDate: "Mar 22, 2024", wordCount: 3800 },
      { id: 3, title: "The Awakening", publishedDate: "Mar 29, 2024", wordCount: 4500 },
      { id: 4, title: "Shadows of the Past", publishedDate: "Apr 5, 2024", wordCount: 4100 },
      { id: 5, title: "The Disgraced Knight", publishedDate: "Apr 12, 2024", wordCount: 3900 },
    ],
    stats: { reads: 125000, likes: 8900, bookmarks: 3200 },
  },
}

const defaultNovel = novels["1"]

export function NovelHeader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  const totalWords = novel.chapters.reduce((acc, ch) => acc + ch.wordCount, 0)
  const estimatedReadTime = Math.ceil(totalWords / 250)

  return (
    <section className="border-b border-border/40 bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Cover Placeholder */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex aspect-[2/3] w-full max-w-[280px] items-center justify-center border border-border bg-card">
              <div className="p-6 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 font-serif text-lg text-muted-foreground">
                  {novel.title}
                </p>
              </div>
            </div>
          </div>

          {/* Novel Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {novel.genre}
              </span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                {novel.status}
              </span>
            </div>

            <h1 className="mt-4 font-serif text-3xl font-light tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {novel.title}
            </h1>

            <p className="mt-3 text-lg text-muted-foreground">
              by <span className="font-medium text-foreground">{novel.author}</span>
            </p>

            <p className="mt-6 text-base leading-relaxed text-foreground/80">
              {novel.description}
            </p>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{novel.stats.reads.toLocaleString()} reads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>{novel.stats.likes.toLocaleString()} likes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookmarkPlus className="h-4 w-4" />
                <span>{novel.stats.bookmarks.toLocaleString()} bookmarks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{estimatedReadTime} min read</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={`/novel/${novel.id}/read/1`}>
                  Start Reading
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                <BookmarkPlus className="mr-2 h-4 w-4" />
                Add to Library
              </Button>
              <Button variant="ghost" size="lg">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
