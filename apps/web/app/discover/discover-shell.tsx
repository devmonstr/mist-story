import type { ReactNode } from "react"

interface DiscoverShellProps {
  children: ReactNode
}

export function DiscoverShell({ children }: DiscoverShellProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="border-b border-border/40 bg-background px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-3xl font-light tracking-tight text-foreground sm:text-5xl">
            Discover
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:mt-4 sm:text-lg">
            Explore new worlds, genres, and voices. Find your next favorite story.
          </p>
        </div>
      </section>

      {children}
    </>
  )
}
