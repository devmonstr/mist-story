"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, ChevronRight } from "lucide-react"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"

import type { DiscoverCollection } from "./discover-data"

interface CollectionsGridProps {
  collections: DiscoverCollection[]
}

export function CollectionsGrid({ collections }: CollectionsGridProps) {
  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12">
          <h2 className="font-serif text-xl font-light tracking-tight text-foreground sm:text-2xl">
            Curated Collections
          </h2>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Handpicked and community-curated selections of exceptional stories.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {collections.map((collection) => (
            <article
              key={collection.id}
              className="flex flex-col justify-between border border-border/40 bg-card p-5 transition-all hover:border-border/80 hover:shadow-sm sm:p-8"
            >
              <div>
                <h3 className="font-serif text-lg font-medium text-foreground sm:text-xl">
                  {collection.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {collection.description}
                </p>
              </div>
              {collection.previewNovels.length > 0 ? (
                <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6">
                  {collection.previewNovels.map((novel) => {
                    const coverSrc = resolveNovelCoverSrc({
                      novelId: novel.id,
                      coverUrl: novel.coverUrl,
                      coverStorageKey: novel.coverStorageKey,
                    })

                    return (
                      <Link
                        key={novel.id}
                        href={`/novel/${novel.slug}`}
                        className="group overflow-hidden border border-border/40 bg-muted/20"
                        title={`${novel.title} by ${novel.authorName}`}
                      >
                        {coverSrc ? (
                          <img
                            src={coverSrc}
                            alt={`${novel.title} cover`}
                            className="aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex aspect-[3/4] w-full items-center justify-center text-muted-foreground">
                            <BookOpen className="h-5 w-5" />
                          </div>
                        )}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 border-t border-border/40 pt-4 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium">{collection.curator}</p>
                  <p>{collection.storyCount} stories</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="w-full sm:w-auto">
                  <Link href={collection.href}>
                    Explore <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
