import { StoryCardSkeleton } from "@/components/skeletons/story-card-skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section Skeleton */}
      <section className="border-b border-border/40 bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-4 h-5 w-96 animate-pulse rounded bg-muted" />
          </div>

          {/* Search Bar Skeleton */}
          <div className="relative max-w-2xl">
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </section>

      {/* Stories Grid Skeleton */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-8 w-28 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <StoryCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
