'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface Story {
  id: string
  title: string
  author: string
  genre: string
  chapters: number
  description: string
  reads: number
}

const stories: Story[] = [
  {
    id: "1",
    title: "The Forgotten Kingdom",
    author: "Emma Stone",
    genre: "Fantasy",
    chapters: 24,
    description: "An epic tale of magic, adventure, and redemption across forgotten realms.",
    reads: 12500,
  },
  {
    id: "2",
    title: "Midnight in the City",
    author: "James River",
    genre: "Mystery",
    chapters: 18,
    description: "A gripping detective story that unravels secrets in a sprawling metropolis.",
    reads: 8900,
  },
  {
    id: "3",
    title: "Hearts in Transit",
    author: "Sarah Mitchell",
    genre: "Romance",
    chapters: 32,
    description: "Two strangers meet on a train and discover love in unexpected places.",
    reads: 15600,
  },
  {
    id: "4",
    title: "The Last Signal",
    author: "David Chen",
    genre: "Science Fiction",
    chapters: 28,
    description: "Humanity's final message to the stars before the silence.",
    reads: 11200,
  },
  {
    id: "5",
    title: "Echoes of the Past",
    author: "Laura Rossi",
    genre: "Historical",
    chapters: 26,
    description: "A journey through time that reveals hidden truths about a forgotten era.",
    reads: 9800,
  },
  {
    id: "6",
    title: "The Phantom Door",
    author: "Michael Brooks",
    genre: "Thriller",
    chapters: 22,
    description: "A door appears in your apartment. It shouldn't exist. Now your life changes forever.",
    reads: 13400,
  },
]

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStories = stories.filter(
    (story) =>
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.genre.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8">
              <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
                Library
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Browse thousands of stories from talented writers around the world.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, or genre..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Stories Grid */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {filteredStories.length} Stories
              </h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Most Popular
                </Button>
                <Button variant="outline" size="sm">
                  Recent
                </Button>
              </div>
            </div>

            {filteredStories.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredStories.map((story) => (
                  <article
                    key={story.id}
                    className="flex flex-col border border-border/40 bg-card p-6 transition-all hover:border-border/80 hover:shadow-sm"
                  >
                    <div className="flex-1">
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="font-serif text-lg font-medium text-foreground line-clamp-2">
                          <Link href={`/novel/${story.id}`} className="hover:underline">
                            {story.title}
                          </Link>
                        </h3>
                        <span className="flex-shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                          {story.genre}
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-muted-foreground">
                        by <span className="font-medium">{story.author}</span>
                      </p>
                      <p className="mb-4 text-sm text-foreground/80 line-clamp-3">
                        {story.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{story.chapters} chapters</span>
                        <span>{story.reads.toLocaleString()} reads</span>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/novel/${story.id}`}>Read</Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg text-muted-foreground">
                  No stories found matching "{searchQuery}"
                </p>
                <Button
                  variant="ghost"
                  onClick={() => setSearchQuery("")}
                  className="mt-4"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
