import { StoryCardSkeleton } from "@/components/skeletons/story-card-skeleton"

export function StoriesGridSkeleton() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-8 w-28 animate-pulse rounded bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4 2xl:grid-cols-5">
        {[...Array(6)].map((_, i) => (
          <StoryCardSkeleton key={i} />
        ))}
      </div>
    </>
  )
}
