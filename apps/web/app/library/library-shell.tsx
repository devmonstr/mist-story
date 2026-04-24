"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Search } from "lucide-react"
import type { ReactNode } from "react"
import { getNovelGenreLabel } from "@myth/shared"
import { useLibraryCatalogContext } from "./library-catalog-context"

interface LibraryShellProps {
  children: ReactNode
}

export function LibraryShell({ children }: LibraryShellProps) {
  const {
    query,
    sortBy,
    genre,
    workType,
    status,
    collection,
    setQuery,
    setSortBy,
    setGenre,
    setWorkType,
    setStatus,
    setCollection,
    clearFilters,
  } = useLibraryCatalogContext()

  return (
    <>
      <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
        <div className={pageContentContainerClassName}>
          <div className="mb-6 sm:mb-8">
            <h1 className={pageHeadingTitleClassName}>
              Library
            </h1>
            <p className={pageHeadingLeadClassName}>
              Browse thousands of stories from talented writers around the world.
            </p>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or genre..."
              className="h-11 pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="mt-4 grid gap-3 sm:mt-5 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as "recent" | "popular" | "rating" | "title")
              }
              className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="recent">Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Top Rated</option>
              <option value="title">Title A-Z</option>
            </select>

            <select
              value={workType ?? ""}
              onChange={(event) =>
                setWorkType(
                  event.target.value === "ORIGINAL" || event.target.value === "TRANSLATION"
                    ? event.target.value
                    : null
                )
              }
              className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Work Types</option>
              <option value="ORIGINAL">Original</option>
              <option value="TRANSLATION">Translation</option>
            </select>

            <select
              value={status ?? ""}
              onChange={(event) =>
                setStatus(
                  event.target.value === "Ongoing" ||
                    event.target.value === "Completed" ||
                    event.target.value === "Hiatus"
                    ? event.target.value
                    : null
                )
              }
              className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Statuses</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Hiatus">Hiatus</option>
            </select>

            <Button variant="outline" className="h-10" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          {genre ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                Genre: {getNovelGenreLabel(genre)}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1"
                onClick={() => setGenre(null)}
              >
                Remove
              </Button>
              {collection ? (
                <>
                  <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                    Collection: {collection.replace(/-/g, " ")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1"
                    onClick={() => setCollection(null)}
                  >
                    Remove
                  </Button>
                </>
              ) : null}
            </div>
          ) : collection ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                Collection: {collection.replace(/-/g, " ")}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1"
                onClick={() => setCollection(null)}
              >
                Remove
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className={pageSectionPaddingClassName}>
        <div className={pageContentContainerClassName}>{children}</div>
      </section>
    </>
  )
}
