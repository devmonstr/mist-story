"use client"

import {
  createContext,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { CatalogSortBy } from "@mist/shared"

type WorkTypeFilter = "ORIGINAL" | "TRANSLATION" | null
type StatusFilter = "Ongoing" | "Completed" | "Hiatus" | null
type CollectionFilter =
  | "trending"
  | "hidden-gems"
  | "editors-picks"
  | "new-voices"
  | null

interface LibraryCatalogContextValue {
  query: string
  deferredQuery: string
  sortBy: CatalogSortBy
  page: number
  genre: string | null
  workType: WorkTypeFilter
  status: StatusFilter
  collection: CollectionFilter
  setQuery: (query: string) => void
  setSortBy: (sortBy: CatalogSortBy) => void
  setPage: (page: number) => void
  setGenre: (genre: string | null) => void
  setWorkType: (workType: WorkTypeFilter) => void
  setStatus: (status: StatusFilter) => void
  setCollection: (collection: CollectionFilter) => void
  clearQuery: () => void
  clearFilters: () => void
}

const LibraryCatalogContext = createContext<LibraryCatalogContextValue | null>(null)

function normalizeSortBy(value: string | null): CatalogSortBy {
  return value === "popular" || value === "rating" || value === "title"
    ? value
    : "recent"
}

function normalizeWorkType(value: string | null): WorkTypeFilter {
  return value === "ORIGINAL" || value === "TRANSLATION" ? value : null
}

function normalizeStatus(value: string | null): StatusFilter {
  return value === "Ongoing" || value === "Completed" || value === "Hiatus"
    ? value
    : null
}

function normalizeCollection(value: string | null): CollectionFilter {
  return value === "trending" ||
    value === "hidden-gems" ||
    value === "editors-picks" ||
    value === "new-voices"
    ? value
    : null
}

function normalizePage(value: string | null) {
  const page = Number.parseInt(value ?? "", 10)
  return Number.isFinite(page) && page > 0 ? page : 1
}

export function LibraryCatalogProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [sortBy, setSortBy] = useState<CatalogSortBy>(
    normalizeSortBy(searchParams.get("sort"))
  )
  const [page, setPage] = useState<number>(normalizePage(searchParams.get("page")))
  const [genre, setGenre] = useState<string | null>(searchParams.get("genre") || null)
  const [workType, setWorkType] = useState<WorkTypeFilter>(
    normalizeWorkType(searchParams.get("workType"))
  )
  const [status, setStatus] = useState<StatusFilter>(
    normalizeStatus(searchParams.get("status"))
  )
  const [collection, setCollection] = useState<CollectionFilter>(
    normalizeCollection(searchParams.get("collection"))
  )
  const deferredQuery = useDeferredValue(query.trim())
  const lastSyncedSearch = useRef<string>(searchParams.toString())

  useEffect(() => {
    const currentSearch = searchParams.toString()
    const nextQuery = searchParams.get("q") || ""

    if (currentSearch !== lastSyncedSearch.current) {
      setQuery(nextQuery)
    }
    setSortBy(normalizeSortBy(searchParams.get("sort")))
    setPage(normalizePage(searchParams.get("page")))
    setGenre(searchParams.get("genre") || null)
    setWorkType(normalizeWorkType(searchParams.get("workType")))
    setStatus(normalizeStatus(searchParams.get("status")))
    setCollection(normalizeCollection(searchParams.get("collection")))
  }, [searchParams])

  const nextSearch = useMemo(() => {
    const params = new URLSearchParams()

    if (deferredQuery) {
      params.set("q", deferredQuery)
    }
    if (sortBy !== "recent") {
      params.set("sort", sortBy)
    }
    if (page > 1) {
      params.set("page", String(page))
    }
    if (genre?.trim()) {
      params.set("genre", genre.trim())
    }
    if (workType) {
      params.set("workType", workType)
    }
    if (status) {
      params.set("status", status)
    }
    if (collection) {
      params.set("collection", collection)
    }

    return params.toString()
  }, [collection, deferredQuery, genre, page, sortBy, status, workType])

  useEffect(() => {
    const currentSearch = searchParams.toString()

    if (nextSearch === currentSearch) {
      lastSyncedSearch.current = currentSearch
      return
    }

    lastSyncedSearch.current = nextSearch
    router.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname, { scroll: false })
  }, [nextSearch, pathname, router, searchParams])

  return (
    <LibraryCatalogContext.Provider
      value={{
        query,
        deferredQuery,
        sortBy,
        page,
        genre,
        workType,
        status,
        collection,
        setQuery: (nextQuery) => {
          setQuery(nextQuery)
          setPage(1)
        },
        setSortBy: (nextSortBy) => {
          setSortBy(nextSortBy)
          setPage(1)
        },
        setPage,
        setGenre: (nextGenre) => {
          setGenre(nextGenre)
          setPage(1)
        },
        setWorkType: (nextWorkType) => {
          setWorkType(nextWorkType)
          setPage(1)
        },
        setStatus: (nextStatus) => {
          setStatus(nextStatus)
          setPage(1)
        },
        setCollection: (nextCollection) => {
          setCollection(nextCollection)
          setPage(1)
        },
        clearQuery: () => {
          setQuery("")
          setPage(1)
        },
        clearFilters: () => {
          setGenre(null)
          setWorkType(null)
          setStatus(null)
          setCollection(null)
          setSortBy("recent")
          setPage(1)
        },
      }}
    >
      {children}
    </LibraryCatalogContext.Provider>
  )
}

export function useLibraryCatalogContext() {
  const context = useContext(LibraryCatalogContext)
  if (!context) {
    throw new Error("useLibraryCatalogContext must be used within LibraryCatalogProvider")
  }

  return context
}
