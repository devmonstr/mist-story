'use client'

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface Category {
  id: string
  title: string
  description: string
  storieCount: number
  color: string
}

const categories: Category[] = [
  {
    id: "fantasy",
    title: "Fantasy",
    description: "Epic adventures, magic, and otherworldly realms.",
    storieCount: 2840,
    color: "bg-muted/60",
  },
  {
    id: "romance",
    title: "Romance",
    description: "Love stories that touch the heart and inspire.",
    storieCount: 3120,
    color: "bg-muted/40",
  },
  {
    id: "mystery",
    title: "Mystery & Thriller",
    description: "Suspenseful tales that keep you guessing until the end.",
    storieCount: 1950,
    color: "bg-muted/60",
  },
  {
    id: "sci-fi",
    title: "Science Fiction",
    description: "Futuristic worlds and imaginative technology.",
    storieCount: 1680,
    color: "bg-muted/40",
  },
  {
    id: "historical",
    title: "Historical Fiction",
    description: "Stories set in fascinating periods of history.",
    storieCount: 1420,
    color: "bg-muted/60",
  },
  {
    id: "literary",
    title: "Literary Fiction",
    description: "Thoughtful narratives exploring the human condition.",
    storieCount: 890,
    color: "bg-muted/40",
  },
]

interface Collection {
  id: string
  title: string
  description: string
  storyCount: number
  curator: string
}

const collections: Collection[] = [
  {
    id: "trending",
    title: "Trending This Week",
    description: "The most-read stories gaining popularity right now.",
    storyCount: 45,
    curator: "Inkwell Editors",
  },
  {
    id: "hidden-gems",
    title: "Hidden Gems",
    description: "Underrated stories that deserve more attention.",
    storyCount: 32,
    curator: "Community",
  },
  {
    id: "editors-picks",
    title: "Editor's Picks",
    description: "Our favorite stories showcasing exceptional writing.",
    storyCount: 28,
    curator: "Inkwell Team",
  },
  {
    id: "new-voices",
    title: "New Voices",
    description: "First stories from fresh and exciting writers.",
    storyCount: 56,
    curator: "Community",
  },
]

export default function DiscoverPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Discover
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore new worlds, genres, and voices. Find your next favorite story.
            </p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="border-b border-border/40 px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-light tracking-tight text-foreground">
                Browse by Genre
              </h2>
              <p className="mt-2 text-muted-foreground">
                Find stories in your favorite genres or explore something new.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`flex flex-col justify-between rounded-lg border border-border/40 p-8 text-left transition-all hover:border-border/80 hover:shadow-sm ${category.color}`}
                >
                  <div>
                    <h3 className="font-serif text-xl font-medium text-foreground">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/20">
                    <span className="text-xs font-medium text-muted-foreground">
                      {category.storieCount.toLocaleString()} stories
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-light tracking-tight text-foreground">
                Curated Collections
              </h2>
              <p className="mt-2 text-muted-foreground">
                Handpicked and community-curated selections of exceptional stories.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {collections.map((collection) => (
                <article
                  key={collection.id}
                  className="flex flex-col justify-between border border-border/40 bg-card p-8 transition-all hover:border-border/80 hover:shadow-sm"
                >
                  <div>
                    <h3 className="font-serif text-xl font-medium text-foreground">
                      {collection.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium">{collection.curator}</p>
                      <p>{collection.storyCount} stories</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Explore <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
