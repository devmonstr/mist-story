"use client"

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

export function CategoriesGrid() {
  return (
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
              <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-4">
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
  )
}
