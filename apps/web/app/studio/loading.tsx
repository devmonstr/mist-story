import {
  StudioStatsSkeleton,
  NovelListSkeleton,
} from "@/components/skeletons/studio-skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Section Skeleton */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="h-8 w-40 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-10 w-28 animate-pulse rounded bg-muted" />
          </div>

          {/* Stats */}
          <div className="mt-8">
            <StudioStatsSkeleton />
          </div>
        </div>
      </section>

      {/* Novels List Section Skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter Tabs Skeleton */}
        <div className="mb-6 flex items-center gap-1 border-b border-border/40">
          <div className="h-10 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-16 animate-pulse rounded bg-muted" />
        </div>

        {/* Novel Cards Skeleton */}
        <NovelListSkeleton />
      </section>
    </div>
  )
}
