"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type {
  PublicCatalogFacetCounts,
  SearchFilterType,
  SearchSortBy,
} from "@mist/shared"
import { NovelCard } from "@/components/novel/novel-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  pageContentContainerClassName,
  pageHeadingLeadClassName,
  pageHeadingTitleClassName,
  pageSectionPaddingClassName,
} from "@/components/page-heading"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { Filter, Loader2, Search, UserRound } from "lucide-react"
import {
  loadSearchResults,
  type SearchPagination,
  type SearchResult,
} from "./search-data"

type WorkTypeFilter = "ORIGINAL" | "TRANSLATION" | null
type StatusFilter = "Ongoing" | "Completed" | "Hiatus" | null
type CursorDirection = "next" | "prev" | null
const SEARCH_PAGE_SIZE = 20
const MAX_SEARCH_QUERY_LENGTH = 120

function normalizeWorkType(value: string | null): WorkTypeFilter {
  return value === "ORIGINAL" || value === "TRANSLATION" ? value : null
}

function normalizeStatus(value: string | null): StatusFilter {
  return value === "Ongoing" || value === "Completed" || value === "Hiatus"
    ? value
    : null
}

function isNovelResult(result: SearchResult) {
  return result.type === "novel"
}

function getAuthorInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function buildSearchUrl(input: {
  query: string
  filterType: SearchFilterType
  sortBy: SearchSortBy
  cursor?: string | null
  direction?: CursorDirection
  pageSize?: number
  genre?: string | null
  workType?: WorkTypeFilter
  status?: StatusFilter
}) {
  const params = new URLSearchParams()

  const normalizedQuery = input.query.replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_QUERY_LENGTH)

  if (normalizedQuery) {
    params.set("q", normalizedQuery)
  }
  if (input.filterType !== "all") {
    params.set("type", input.filterType)
  }
  if (input.sortBy !== "relevance") {
    params.set("sort", input.sortBy)
  }
  if (input.cursor && input.direction) {
    params.set("cursor", input.cursor)
    params.set("direction", input.direction)
  }
  if (input.pageSize && input.pageSize !== SEARCH_PAGE_SIZE) {
    params.set("pageSize", String(input.pageSize))
  }
  if (input.genre?.trim()) {
    params.set("genre", input.genre.trim())
  }
  if (input.workType) {
    params.set("workType", input.workType)
  }
  if (input.status) {
    params.set("status", input.status)
  }

  const queryString = params.toString()
  return queryString ? `/search?${queryString}` : "/search"
}

function buildLibraryHref(input: {
  query: string
  genre?: string | null
  workType?: WorkTypeFilter
  status?: StatusFilter
}) {
  const params = new URLSearchParams()

  if (input.query.trim()) {
    params.set("q", input.query.trim())
  }
  if (input.genre?.trim()) {
    params.set("genre", input.genre.trim())
  }
  if (input.workType) {
    params.set("workType", input.workType)
  }
  if (input.status) {
    params.set("status", input.status)
  }

  const queryString = params.toString()
  return queryString ? `/library?${queryString}` : "/library"
}

function SearchResultCard({ result }: { result: SearchResult }) {
  if (isNovelResult(result)) {
    const coverSrc = resolveNovelCoverSrc({
      novelId: result.id,
      coverUrl: result.coverUrl,
      coverStorageKey: result.coverStorageKey,
    })
    const novelHref = `/novel/${result.slug}`

    return (
      <NovelCard
        href={novelHref}
        title={result.title}
        coverSrc={coverSrc}
        authorName={result.authorName}
        authorHref={`/profile/${result.authorNpub}`}
        summary={result.summary}
        titleAside={
          <span className="border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {result.genre}
          </span>
        }
        footer={
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              <span>{result.chaptersCount} chapters</span>
              <span>{result.readsCount.toLocaleString()} reads</span>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href={novelHref}>Read</Link>
            </Button>
          </div>
        }
      />
    )
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden border border-border/40 bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm">
      {result.avatarUrl ? (
        <div className="pointer-events-none absolute inset-0 opacity-[0.60]">
          <img
            src={result.avatarUrl}
            alt=""
            className="h-full w-full scale-110 object-cover blur-sm"
            aria-hidden="true"
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background" />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-4 flex items-start gap-3">
          <Avatar className="h-12 w-12 border border-border/40 sm:h-14 sm:w-14">
            {result.avatarUrl ? <AvatarImage src={result.avatarUrl} alt={result.name} /> : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              {getAuthorInitials(result.name) || <UserRound className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 font-serif text-sm font-semibold text-foreground sm:text-base">
              <Link href={`/profile/${result.npub}`} className="hover:underline">
                {result.name}
              </Link>
            </h3>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/80 sm:text-sm">
              {result.bio}
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-border/40 pt-3">
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span>{result.followersCount.toLocaleString()} followers</span>
            <span>{result.novelsCount} novels</span>
          </div>
          <Button variant="outline" asChild size="sm" className="w-full">
            <Link href={`/profile/${result.npub}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

function ResultsGrid({ results }: { results: SearchResult[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  )
}

function ResultsSection({
  title,
  count,
  results,
}: {
  title: string
  count: number
  results: SearchResult[]
}) {
  if (count === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">{count}</span>
      </div>
      <ResultsGrid results={results} />
    </section>
  )
}

function ResultsCount({
  count,
  query,
  isApproximate,
}: {
  count: number
  query: string
  isApproximate?: boolean
}) {
  if (isApproximate) {
    return (
      <p className="text-sm text-muted-foreground">
        Showing top matches for "{query.trim()}"
      </p>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Found {count} result{count !== 1 ? "s" : ""} for "{query.trim()}"
    </p>
  )
}

export function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentSearch = searchParams.toString()
  const urlQuery = searchParams.get("q") || ""
  const filterType = (searchParams.get("type") as SearchFilterType) || "all"
  const sortBy = (searchParams.get("sort") as SearchSortBy) || "relevance"
  const cursor = searchParams.get("cursor") || ""
  const direction = searchParams.get("direction") as CursorDirection
  const genre = searchParams.get("genre") || ""
  const workType = normalizeWorkType(searchParams.get("workType"))
  const status = normalizeStatus(searchParams.get("status"))
  const [queryInput, setQueryInput] = useState(urlQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [facets, setFacets] = useState<PublicCatalogFacetCounts | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [isApproximateTotal, setIsApproximateTotal] = useState(false)
  const [pagination, setPagination] = useState<SearchPagination>({
    currentCursor: null,
    nextCursor: null,
    previousCursor: null,
    totalItems: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastSyncedSearch = useRef(currentSearch)

  useEffect(() => {
    if (currentSearch !== lastSyncedSearch.current) {
      setQueryInput(urlQuery)
    }
  }, [currentSearch, urlQuery])

  useEffect(() => {
    const normalizedInput = queryInput.trim()
    if (normalizedInput === urlQuery.trim()) {
      return
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        const nextUrl = buildSearchUrl({
          query: queryInput,
          filterType,
          sortBy,
          cursor: null,
          direction: null,
          genre,
          workType,
          status,
        })
        lastSyncedSearch.current = nextUrl.replace(/^\/search\??/, "")
        router.replace(
          nextUrl
        )
      })
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterType, genre, queryInput, router, sortBy, startTransition, status, urlQuery, workType])

  useEffect(() => {
    const normalizedQuery = urlQuery.trim()

    if (!normalizedQuery) {
      setResults([])
      setFacets(null)
      setTotalResults(0)
      setIsApproximateTotal(false)
      setPagination({
        currentCursor: null,
        nextCursor: null,
        previousCursor: null,
        totalItems: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      })
      setIsLoading(false)
      setError(null)
      return
    }

    let active = true
    setIsLoading(true)
    setError(null)

    void loadSearchResults({
      query: normalizedQuery,
      filterType,
      sortBy,
      cursor,
      direction,
      pageSize: SEARCH_PAGE_SIZE,
      genre,
      workType,
      status,
    })
      .then((payload) => {
        if (!active) {
          return
        }

        setResults(payload.items)
        setFacets(payload.facets ?? null)
        setTotalResults(payload.total)
        setIsApproximateTotal(Boolean(payload.isApproximateTotal))
        setPagination(payload.pagination)
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setResults([])
        setFacets(null)
        setTotalResults(0)
        setIsApproximateTotal(false)
        setPagination({
          currentCursor: null,
          nextCursor: null,
          previousCursor: null,
          totalItems: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        })
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load search results."
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
  }, [cursor, direction, filterType, genre, sortBy, status, urlQuery, workType])

  const hasQuery = urlQuery.trim().length > 0
  const showNovelFilters = filterType !== "author"
  const libraryHref = buildLibraryHref({
    query: queryInput,
    genre: showNovelFilters ? genre : null,
    workType: showNovelFilters ? workType : null,
    status: showNovelFilters ? status : null,
  })
  const novelResults = useMemo(
    () =>
      results.filter(
        (result): result is Extract<SearchResult, { type: "novel" }> => result.type === "novel"
      ),
    [results]
  )
  const authorResults = useMemo(
    () =>
      results.filter(
        (result): result is Extract<SearchResult, { type: "author" }> => result.type === "author"
      ),
    [results]
  )

  const navigateWithFilters = (next: {
    filterType?: SearchFilterType
    sortBy?: SearchSortBy
    cursor?: string | null
    direction?: CursorDirection
    genre?: string | null
    workType?: WorkTypeFilter
    status?: StatusFilter
  }) => {
    startTransition(() => {
      const nextUrl = buildSearchUrl({
        query: queryInput,
        filterType: next.filterType ?? filterType,
        sortBy: next.sortBy ?? sortBy,
        cursor: next.cursor,
        direction: next.direction,
        genre: next.genre ?? genre,
        workType: next.workType ?? workType,
        status: next.status ?? status,
      })
      lastSyncedSearch.current = nextUrl.replace(/^\/search\??/, "")
      router.replace(
        nextUrl
      )
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    navigateWithFilters({ cursor: null, direction: null })
  }

  return (
    <>
      <section className={`border-b border-border bg-card ${pageSectionPaddingClassName}`}>
        <div className={pageContentContainerClassName}>
          <h1 className={pageHeadingTitleClassName}>Search Results</h1>
          <p className={pageHeadingLeadClassName}>
            Search stories and writers across Mist Story.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 sm:mt-8 sm:flex-row">
            <div className="relative flex-1">
              <Input
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="Search novels, authors, genres..."
                maxLength={MAX_SEARCH_QUERY_LENGTH}
                className="h-11 pr-4"
              />
            </div>
            <Button type="submit" className="h-11 w-full sm:w-auto" disabled={isPending}>
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className={`${pageContentContainerClassName} pt-6 sm:pt-8`}>
        {hasQuery && !isLoading && !error && results.length > 0 ? (
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <ResultsCount
              count={totalResults || results.length}
              query={urlQuery}
              isApproximate={isApproximateTotal}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
              <Button variant="outline" asChild className="h-10">
                <Link href={libraryHref}>Browse in Library</Link>
              </Button>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(event) => {
                    const nextFilterType = event.target.value as SearchFilterType
                    navigateWithFilters({
                      filterType: nextFilterType,
                      cursor: null,
                      direction: null,
                      genre: nextFilterType === "author" ? null : genre,
                      workType: nextFilterType === "author" ? null : workType,
                      status: nextFilterType === "author" ? null : status,
                    })
                  }}
                  className="h-10 min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
                >
                  <option value="all">All Results</option>
                  <option value="novel">Novels</option>
                  <option value="author">Authors</option>
                </select>
              </div>

              {showNovelFilters ? (
                <>
                  <select
                    value={genre}
                    onChange={(event) =>
                      navigateWithFilters({
                        cursor: null,
                        direction: null,
                        genre: event.target.value || null,
                      })
                    }
                    className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
                  >
                    <option value="">All Genres</option>
                    {(facets?.genres ?? []).map((facet) => (
                      <option key={facet.value} value={facet.value}>
                        {facet.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={workType ?? ""}
                    onChange={(event) =>
                      navigateWithFilters({
                        cursor: null,
                        direction: null,
                        workType: normalizeWorkType(event.target.value || null),
                      })
                    }
                    className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
                  >
                    <option value="">All Work Types</option>
                    <option value="ORIGINAL">Original</option>
                    <option value="TRANSLATION">Translation</option>
                  </select>

                  <select
                    value={status ?? ""}
                    onChange={(event) =>
                      navigateWithFilters({
                        cursor: null,
                        direction: null,
                        status: normalizeStatus(event.target.value || null),
                      })
                    }
                    className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
                  >
                    <option value="">All Statuses</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Hiatus">Hiatus</option>
                  </select>
                </>
              ) : null}

              <select
                value={sortBy}
                onChange={(event) =>
                  navigateWithFilters({
                    cursor: null,
                    direction: null,
                    sortBy: event.target.value as SearchSortBy,
                  })
                }
                className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
              >
                <option value="relevance">Relevance</option>
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        ) : null}

        <div>
          {error ? (
            <div className="border border-border/40 bg-card p-8 text-sm text-muted-foreground">
              {error}
            </div>
          ) : isLoading ? (
            <div className="border border-border/40 bg-card p-8 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Searching...</p>
            </div>
          ) : hasQuery && results.length === 0 ? (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                No results found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse our library
              </p>
              <div className="mt-6">
                <Button variant="outline" asChild>
                  <Link href={libraryHref}>Browse in Library</Link>
                </Button>
              </div>
            </div>
          ) : !hasQuery ? (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-serif text-xl font-semibold text-foreground">
                Start searching
              </h3>
              <p className="mb-6 text-muted-foreground">
                Search for novels, authors, or genres to get started
              </p>
              <Button asChild>
                <Link href="/library">Browse Library</Link>
              </Button>
            </div>
          ) : filterType === "all" ? (
            <div className="space-y-8">
              <ResultsSection title="Novels" count={novelResults.length} results={novelResults} />
              <ResultsSection title="Writers" count={authorResults.length} results={authorResults} />
            </div>
          ) : (
            <ResultsGrid results={results} />
          )}

          {hasQuery && (pagination.hasPreviousPage || pagination.hasNextPage) ? (
            <div className="mt-10 flex flex-col gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {isApproximateTotal
                  ? "Showing top matches"
                  : `${pagination.totalItems.toLocaleString()} results`}
              </p>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPreviousPage || isPending}
                  onClick={() =>
                    navigateWithFilters({
                      cursor: pagination.previousCursor,
                      direction: "prev",
                    })
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage || isPending}
                  onClick={() =>
                    navigateWithFilters({
                      cursor: pagination.nextCursor,
                      direction: "next",
                    })
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
