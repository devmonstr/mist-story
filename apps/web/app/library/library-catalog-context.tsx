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
type CursorDirection = "next" | "prev" | null

interface LibraryCatalogContextValue {
  query: string
  deferredQuery: string
  sortBy: CatalogSortBy
  cursor: string | null
  direction: CursorDirection
  genre: string | null
  workType: WorkTypeFilter
  status: StatusFilter
  collection: CollectionFilter
  setQuery: (query: string) => void
  setSortBy: (sortBy: CatalogSortBy) => void
  setCursorState: (state: { cursor: string | null; direction: CursorDirection }) => void
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

function normalizeCursor(value: string | null) {
  return value && value.trim().length > 0 ? value : null
}

function normalizeCursorDirection(value: string | null): CursorDirection {
  return value === "next" || value === "prev" ? value : null
}

export function LibraryCatalogProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [sortBy, setSortBy] = useState<CatalogSortBy>(
    normalizeSortBy(searchParams.get("sort"))
  )
  const [cursor, setCursor] = useState<string | null>(normalizeCursor(searchParams.get("cursor")))
  const [direction, setDirection] = useState<CursorDirection>(
    normalizeCursorDirection(searchParams.get("direction"))
  )
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
  const isSyncingFromUrl = useRef(false)

  useEffect(() => {
    const currentSearch = searchParams.toString()
    const nextQuery = searchParams.get("q") || ""
    const nextSortBy = normalizeSortBy(searchParams.get("sort"))
    const nextCursor = normalizeCursor(searchParams.get("cursor"))
    const nextDirection = normalizeCursorDirection(searchParams.get("direction"))
    const nextGenre = searchParams.get("genre") || null
    const nextWorkType = normalizeWorkType(searchParams.get("workType"))
    const nextStatus = normalizeStatus(searchParams.get("status"))
    const nextCollection = normalizeCollection(searchParams.get("collection"))

    if (currentSearch !== lastSyncedSearch.current) {
      isSyncingFromUrl.current = true
      lastSyncedSearch.current = currentSearch
    }

    setQuery((currentValue) => (currentValue === nextQuery ? currentValue : nextQuery))
    setSortBy((currentValue) => (currentValue === nextSortBy ? currentValue : nextSortBy))
    setCursor((currentValue) => (currentValue === nextCursor ? currentValue : nextCursor))
    setDirection((currentValue) =>
      currentValue === nextDirection ? currentValue : nextDirection
    )
    setGenre((currentValue) => (currentValue === nextGenre ? currentValue : nextGenre))
    setWorkType((currentValue) =>
      currentValue === nextWorkType ? currentValue : nextWorkType
    )
    setStatus((currentValue) => (currentValue === nextStatus ? currentValue : nextStatus))
    setCollection((currentValue) =>
      currentValue === nextCollection ? currentValue : nextCollection
    )
  }, [searchParams])

  const nextSearch = useMemo(() => {
    const params = new URLSearchParams()

    if (deferredQuery) {
      params.set("q", deferredQuery)
    }
    if (sortBy !== "recent") {
      params.set("sort", sortBy)
    }
    if (cursor && direction) {
      params.set("cursor", cursor)
      params.set("direction", direction)
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
  }, [collection, cursor, deferredQuery, direction, genre, sortBy, status, workType])

  useEffect(() => {
    const currentSearch = searchParams.toString()

    if (isSyncingFromUrl.current) {
      if (nextSearch === currentSearch) {
        isSyncingFromUrl.current = false
        lastSyncedSearch.current = currentSearch
      }
      return
    }

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
        cursor,
        direction,
        genre,
        workType,
        status,
        collection,
        setQuery: (nextQuery) => {
          setQuery(nextQuery)
          setCursor(null)
          setDirection(null)
        },
        setSortBy: (nextSortBy) => {
          setSortBy(nextSortBy)
          setCursor(null)
          setDirection(null)
        },
        setCursorState: ({
          cursor: nextCursor,
          direction: nextDirection,
        }) => {
          setCursor(nextCursor)
          setDirection(nextDirection)
        },
        setGenre: (nextGenre) => {
          setGenre(nextGenre)
          setCursor(null)
          setDirection(null)
        },
        setWorkType: (nextWorkType) => {
          setWorkType(nextWorkType)
          setCursor(null)
          setDirection(null)
        },
        setStatus: (nextStatus) => {
          setStatus(nextStatus)
          setCursor(null)
          setDirection(null)
        },
        setCollection: (nextCollection) => {
          setCollection(nextCollection)
          setCursor(null)
          setDirection(null)
        },
        clearQuery: () => {
          setQuery("")
          setCursor(null)
          setDirection(null)
        },
        clearFilters: () => {
          setGenre(null)
          setWorkType(null)
          setStatus(null)
          setCollection(null)
          setSortBy("recent")
          setCursor(null)
          setDirection(null)
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
