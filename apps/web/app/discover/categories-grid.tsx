"use client"

import Link from "next/link"
import { ArrowUpRight, BookOpen, ChevronRight } from "lucide-react"

import type { DiscoverCategory } from "./discover-data"

interface CategoriesGridProps {
  categories: DiscoverCategory[]
}

export function CategoriesGrid({ categories }: CategoriesGridProps) {
  const maxStories = Math.max(...categories.map((category) => category.storiesCount), 1)

  return (
    <section className="border-b border-border/40 bg-muted/20 py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              Active shelves
            </p>
            <h2 className="font-serif text-2xl font-light text-foreground sm:text-3xl">
              Browse by genre
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Start with the busiest shelves, then branch into a mood you did not expect.
            </p>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center text-sm font-medium text-foreground hover:text-primary"
          >
            Open full library
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="group flex min-h-[150px] flex-col justify-between border border-border/40 bg-card p-4 text-left transition-all hover:border-border/80 hover:shadow-sm"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <h3 className="font-serif text-base font-medium text-foreground sm:text-lg">
                    {category.title}
                  </h3>
                  <span className="shrink-0 rounded-full border border-border/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {category.storiesCount.toLocaleString()}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="mt-4 space-y-3 border-t border-border/20 pt-3">
                <div className="h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all group-hover:bg-foreground"
                    style={{
                      width: `${Math.max(
                        8,
                        Math.round((category.storiesCount / maxStories) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Explore shelf
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
