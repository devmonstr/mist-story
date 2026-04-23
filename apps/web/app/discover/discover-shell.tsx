import Link from "next/link"
import type { DiscoverResponse } from "@myth/shared"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface DiscoverShellProps {
  children: ReactNode
  activeFilters?: DiscoverResponse["activeFilters"]
}

function formatCollectionLabel(value: string) {
  return value.replace(/-/g, " ")
}

function buildLibraryHref(activeFilters?: DiscoverResponse["activeFilters"]) {
  const params = new URLSearchParams()

  if (activeFilters?.q?.trim()) {
    params.set("q", activeFilters.q.trim())
  }
  if (activeFilters?.genre?.trim()) {
    params.set("genre", activeFilters.genre.trim())
  }
  if (activeFilters?.workType && activeFilters.workType !== "all") {
    params.set("workType", activeFilters.workType)
  }
  if (activeFilters?.status && activeFilters.status !== "all") {
    params.set("status", activeFilters.status)
  }
  if (activeFilters?.collection && activeFilters.collection !== "all") {
    params.set("collection", activeFilters.collection)
  }
  if (activeFilters?.sort && activeFilters.sort !== "recent") {
    params.set("sort", activeFilters.sort)
  }

  const queryString = params.toString()
  return queryString ? `/library?${queryString}` : "/library"
}

export function DiscoverShell({ children, activeFilters }: DiscoverShellProps) {
  const hasActiveFilters =
    Boolean(activeFilters?.q?.trim()) ||
    Boolean(activeFilters?.genre?.trim()) ||
    (activeFilters?.workType && activeFilters.workType !== "all") ||
    (activeFilters?.status && activeFilters.status !== "all") ||
    (activeFilters?.collection && activeFilters.collection !== "all")
  const browseHref = buildLibraryHref(activeFilters)

  return (
    <>
      {/* Hero Section */}
      <section className={`border-b border-border/40 bg-background ${pageSectionPaddingClassName}`}>
        <div className={pageContentContainerClassName}>
          <h1 className={pageHeadingTitleClassName}>
            Discover
          </h1>
          <p className={pageHeadingLeadClassName}>
            Explore new worlds, genres, and voices. Find your next favorite story.
          </p>

          {hasActiveFilters ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {activeFilters?.q?.trim() ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  Search: {activeFilters.q.trim()}
                </span>
              ) : null}
              {activeFilters?.genre?.trim() ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  Genre: {activeFilters.genre.trim()}
                </span>
              ) : null}
              {activeFilters?.workType && activeFilters.workType !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {activeFilters.workType === "TRANSLATION" ? "Translation" : "Original"}
                </span>
              ) : null}
              {activeFilters?.status && activeFilters.status !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {activeFilters.status}
                </span>
              ) : null}
              {activeFilters?.collection && activeFilters.collection !== "all" ? (
                <span className="rounded-full bg-muted px-3 py-1 capitalize text-foreground">
                  {formatCollectionLabel(activeFilters.collection)}
                </span>
              ) : null}
              <Button variant="outline" size="sm" asChild className="h-8">
                <Link href={browseHref}>Browse in library</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      {children}
    </>
  )
}
