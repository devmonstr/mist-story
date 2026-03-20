"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { ReactNode } from "react"
import { useLibraryCatalogContext } from "./library-catalog-context"

interface LibraryShellProps {
  children: ReactNode
}

export function LibraryShell({ children }: LibraryShellProps) {
  const { query, setQuery } = useLibraryCatalogContext()

  return (
    <>
      <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
              Library
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Browse thousands of stories from talented writers around the world.
            </p>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or genre..."
              className="pl-10"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </section>
    </>
  )
}
