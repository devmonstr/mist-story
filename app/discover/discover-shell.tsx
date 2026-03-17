import type { ReactNode } from "react"

interface DiscoverShellProps {
  children: ReactNode
}

export function DiscoverShell({ children }: DiscoverShellProps) {
  return (
    <>
      {/* Hero Section */}
      <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl font-light tracking-tight text-foreground sm:text-5xl">
            Discover
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore new worlds, genres, and voices. Find your next favorite story.
          </p>
        </div>
      </section>

      {children}
    </>
  )
}
