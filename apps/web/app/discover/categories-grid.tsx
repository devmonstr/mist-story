"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { loadDiscoverData, type DiscoverCategory } from "./discover-data"
import { CategoriesSkeleton } from "./categories-skeleton"

export function CategoriesGrid() {
  const [categories, setCategories] = useState<DiscoverCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    void loadDiscoverData()
      .then((payload) => {
        if (!active) {
          return
        }

        setCategories(payload.genres)
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load categories."
        )
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  if (isLoading) {
    return <CategoriesSkeleton />
  }

  if (error) {
    return (
      <section className="border-b border-border/40 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-border/40 bg-card p-6 text-sm text-muted-foreground sm:p-8">
            {error}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="border-b border-border/40 px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 sm:mb-12">
          <h2 className="font-serif text-xl font-light tracking-tight text-foreground sm:text-2xl">
            Browse by Genre
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Find stories in your favorite genres or explore something new.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={category.href}
              className="flex min-h-[180px] flex-col justify-between rounded-lg border border-border/40 bg-card p-5 text-left transition-all hover:border-border/80 hover:shadow-sm sm:min-h-[220px] sm:p-8"
            >
              <div>
                <h3 className="font-serif text-lg font-medium text-foreground sm:text-xl">
                  {category.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/20 pt-4 sm:mt-6">
                <span className="text-xs font-medium text-muted-foreground">
                  {category.storiesCount.toLocaleString()} stories
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
