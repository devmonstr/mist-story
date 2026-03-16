'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Clock, Eye, Heart, Share2, BookmarkPlus, ChevronRight } from "lucide-react"
import Link from "next/link"
import { use } from "react"

// Sample novel data
const novels: Record<string, {
  id: string
  title: string
  author: string
  authorBio: string
  genre: string
  status: string
  publishedDate: string
  lastUpdated: string
  description: string
  longDescription: string
  chapters: { id: number; title: string; publishedDate: string; wordCount: number }[]
  stats: { reads: number; likes: number; bookmarks: number }
  tags: string[]
}> = {
  "1": {
    id: "1",
    title: "The Forgotten Kingdom",
    author: "Emma Stone",
    authorBio: "Emma Stone is a bestselling fantasy author known for her richly detailed worlds and compelling characters. She has been writing for over a decade.",
    genre: "Fantasy",
    status: "Ongoing",
    publishedDate: "March 15, 2024",
    lastUpdated: "January 8, 2026",
    description: "An epic tale of magic, adventure, and redemption across forgotten realms.",
    longDescription: `In the shadows of the Elderwood Mountains lies a kingdom lost to time—a realm where magic once flowed like rivers and ancient beings walked among mortals. When young archivist Elara discovers a forbidden manuscript in the royal library, she unwittingly awakens powers that have slumbered for centuries.

As darkness creeps across the land and old enemies stir from their slumber, Elara must navigate treacherous politics, forbidden romance, and the weight of a destiny she never asked for. With the help of a disgraced knight, a mysterious scholar, and a creature of legend, she must uncover the truth behind the kingdom's fall—before history repeats itself.

The Forgotten Kingdom is a sweeping epic fantasy that explores themes of power, sacrifice, and the enduring strength of hope in the darkest of times.`,
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
    stats: { reads: 125000, likes: 8900, bookmarks: 3200 },
    tags: ["Epic Fantasy", "Magic", "Adventure", "Romance", "Mystery"],
  },
}

// Default novel for unknown IDs
const defaultNovel = novels["1"]

export default function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const novel = novels[id] || defaultNovel

  const totalWords = novel.chapters.reduce((acc, ch) => acc + ch.wordCount, 0)
  const estimatedReadTime = Math.ceil(totalWords / 250) // 250 words per minute

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Novel Header */}
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

        {/* Novel Content */}
        <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-3">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* About */}
                <div>
                  <h2 className="font-serif text-2xl text-foreground">About this story</h2>
                  <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
                    {novel.longDescription}
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-foreground">Tags</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {novel.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <Separator className="my-10" />

                {/* Chapters */}
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
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-8">
                  {/* Author Info */}
                  <div className="border border-border/40 bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">About the Author</h3>
                    <div className="mt-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
                        {novel.author.charAt(0)}
                      </div>
                      <p className="mt-3 font-serif text-lg text-foreground">{novel.author}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {novel.authorBio}
                      </p>
                      <Button variant="outline" size="sm" className="mt-4 w-full">
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Story Details */}
                  <div className="border border-border/40 bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">Story Details</h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Published</dt>
                        <dd className="text-foreground">{novel.publishedDate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Last Updated</dt>
                        <dd className="text-foreground">{novel.lastUpdated}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Total Words</dt>
                        <dd className="text-foreground">{totalWords.toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Status</dt>
                        <dd className="text-foreground">{novel.status}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
