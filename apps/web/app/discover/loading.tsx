import { ChevronRight } from "lucide-react"

function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-border/40 p-8">
      <div>
        <div className="h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-2 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border/20 pt-4">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </div>
  )
}

function CollectionCardSkeleton() {
  return (
    <div className="flex flex-col justify-between border border-border/40 bg-card p-8">
      <div>
        <div className="h-7 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-2 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
        <div className="space-y-1">
          <div className="h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section Skeleton */}
      <section className="border-b border-border/40 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-4 h-5 w-96 animate-pulse rounded bg-muted" />
        </div>
      </section>

      {/* Categories Section Skeleton */}
      <section className="border-b border-border/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="h-8 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Collections Section Skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="h-8 w-56 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded bg-muted" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
