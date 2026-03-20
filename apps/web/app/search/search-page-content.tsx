"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { resolveNovelCoverSrc } from "@/lib/novel-cover"
import { BookOpen, Filter, Loader2, Search, UserRound } from "lucide-react"
import type { SearchFilterType, SearchSortBy } from "@mist/shared"
import { loadSearchResults, type SearchResult } from "./search-data"

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

function SearchResultCard({ result }: { result: SearchResult }) {
  if (isNovelResult(result)) {
    const coverSrc = resolveNovelCoverSrc({
      novelId: result.id,
      coverUrl: result.coverUrl,
      coverStorageKey: result.coverStorageKey,
    })

    return (
      <article className="flex h-full flex-col overflow-hidden border border-border/40 bg-card transition-all hover:border-border/80 hover:shadow-sm">
        <Link
          href={`/novel/${result.slug}`}
          className="block border-b border-border/40 bg-muted/20"
        >
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={`${result.title} cover`}
              className="aspect-[3/4] w-full object-cover sm:aspect-[2/3]"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted/40 text-muted-foreground sm:aspect-[2/3]">
              <BookOpen className="h-8 w-8" />
            </div>
          )}
        </Link>

        <div className="flex flex-1 flex-col p-3 sm:p-4">
          <div className="mb-3 flex-1">
            <h3 className="line-clamp-2 font-serif text-sm font-semibold text-foreground sm:text-base">
              <Link href={`/novel/${result.slug}`} className="hover:underline">
                {result.title}
              </Link>
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              by{" "}
              <Link href={`/profile/${result.authorNpub}`} className="hover:underline">
                {result.authorName}
              </Link>
            </p>
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-foreground/80 sm:mt-3 sm:text-sm">
              {result.summary}
            </p>
          </div>

          <div className="space-y-3 border-t border-border/40 pt-3">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1">{result.genre}</span>
              <span>{result.chaptersCount} chapters</span>
              <span>{result.readsCount.toLocaleString()} reads</span>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href={`/novel/${result.slug}`}>Read</Link>
            </Button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="relative flex h-full flex-col overflow-hidden border border-border/40 bg-card p-4 transition-all hover:border-border/80 hover:shadow-sm">
      {result.avatarUrl ? (
        <div className="pointer-events-none absolute inset-0 opacity-[0.6]">
          <img
            src={result.avatarUrl}
            alt=""
            className="h-full w-full object-cover blur-sm scale-110"
            aria-hidden="true"
          />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/75 to-background" />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="relative mb-4 flex items-start gap-3">
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

        <div className="relative mt-auto space-y-3 border-t border-border/40 pt-3">
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {results.map((result) => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </div>
  )
}

function ResultsCount({
  count,
  query,
}: {
  count: number
  query: string
}) {
  return (
    <p className="text-sm text-muted-foreground">
      Found {count} result{count !== 1 ? "s" : ""} for "{query.trim()}"
    </p>
  )
}

function buildSearchUrl(query: string, filterType: SearchFilterType, sortBy: SearchSortBy) {
  const params = new URLSearchParams()

  if (query.trim()) {
    params.set("q", query.trim())
  }

  if (filterType !== "all") {
    params.set("type", filterType)
  }

  if (sortBy !== "relevance") {
    params.set("sort", sortBy)
  }

  const queryString = params.toString()
  return queryString ? `/search?${queryString}` : "/search"
}

export function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialFilterType = (searchParams.get("type") as SearchFilterType) || "all"
  const initialSortBy = (searchParams.get("sort") as SearchSortBy) || "relevance"
  const [query, setQuery] = useState(initialQuery)
  const deferredQuery = useDeferredValue(query)
  const [filterType, setFilterType] = useState<SearchFilterType>(initialFilterType)
  const [sortBy, setSortBy] = useState<SearchSortBy>(initialSortBy)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setQuery(initialQuery)
    setFilterType(initialFilterType)
    setSortBy(initialSortBy)
  }, [initialFilterType, initialQuery, initialSortBy])

  useEffect(() => {
    const normalizedQuery = deferredQuery.trim()

    if (!normalizedQuery) {
      setResults([])
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
    })
      .then((payload) => {
        if (!active) {
          return
        }

        setResults(payload.items)
      })
      .catch((loadError) => {
        if (!active) {
          return
        }

        setResults([])
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
  }, [deferredQuery, filterType, sortBy])

  const hasQuery = query.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    router.replace(buildSearchUrl(query, filterType, sortBy))
  }

  const handleFilterTypeChange = (nextFilterType: SearchFilterType) => {
    setFilterType(nextFilterType)
    router.replace(buildSearchUrl(query, nextFilterType, sortBy))
  }

  const handleSortByChange = (nextSortBy: SearchSortBy) => {
    setSortBy(nextSortBy)
    router.replace(buildSearchUrl(query, filterType, nextSortBy))
  }

  return (
    <>
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mb-4 flex items-center gap-3">
            <Search className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
            <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">
              Search Results
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search novels, authors, genres..."
                className="h-11 pr-4"
              />
            </div>
            <Button type="submit" className="h-11 w-full sm:w-auto">
              Search
            </Button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {hasQuery && !isLoading && !error && results.length > 0 && (
          <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <ResultsCount count={results.length} query={query} />

            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterType}
                  onChange={(event) =>
                    handleFilterTypeChange(event.target.value as SearchFilterType)
                  }
                  className="h-10 min-w-0 flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
                >
                  <option value="all">All Results</option>
                  <option value="novel">Novels</option>
                  <option value="author">Authors</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(event) => handleSortByChange(event.target.value as SearchSortBy)}
                className="h-10 rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:min-w-[150px]"
              >
                <option value="relevance">Relevance</option>
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>
        )}

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
          ) : (
            <ResultsGrid results={results} />
          )}
        </div>
      </div>
    </>
  )
}
