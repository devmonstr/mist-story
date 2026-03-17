"use client"

import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

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
    curator: "Mist Story Editors",
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
    curator: "Mist Story Team",
  },
  {
    id: "new-voices",
    title: "New Voices",
    description: "First stories from fresh and exciting writers.",
    storyCount: 56,
    curator: "Community",
  },
]

export function CollectionsGrid() {
  return (
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
  )
}
