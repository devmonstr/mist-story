"use client"

import {
  createContext,
  useContext,
  useDeferredValue,
  useState,
  type ReactNode,
} from "react"

interface LibraryCatalogContextValue {
  query: string
  deferredQuery: string
  setQuery: (query: string) => void
  clearQuery: () => void
}

const LibraryCatalogContext = createContext<LibraryCatalogContextValue | null>(null)

export function LibraryCatalogProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query.trim())

  return (
    <LibraryCatalogContext.Provider
      value={{
        query,
        deferredQuery,
        setQuery,
        clearQuery: () => setQuery(""),
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
