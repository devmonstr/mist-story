import { NovelHeaderSkeleton, ChapterListSkeleton } from "@/components/skeletons/novel-header-skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Novel Header Skeleton */}
      <NovelHeaderSkeleton />

      {/* Novel Content Skeleton */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* About Section Skeleton */}
              <div>
                <div className="h-7 w-40 animate-pulse rounded bg-muted" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>

              {/* Tags Skeleton */}
              <div className="mt-8">
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-muted" />
                  ))}
                </div>
              </div>

              {/* Chapters Skeleton */}
              <div className="mt-10">
                <div className="mb-6 h-7 w-28 animate-pulse rounded bg-muted" />
                <ChapterListSkeleton />
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-8">
                {/* Author Info Skeleton */}
                <div className="border border-border/40 bg-card p-6">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-muted" />
                  <div className="mt-3 h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="mt-2 space-y-2">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="mt-4 h-8 w-full animate-pulse rounded bg-muted" />
                </div>

                {/* Story Details Skeleton */}
                <div className="border border-border/40 bg-card p-6">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="mt-4 space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
