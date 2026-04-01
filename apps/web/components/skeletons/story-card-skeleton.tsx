export function StoryCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden border border-border bg-card">
      <div className="aspect-[3/4] w-full animate-pulse border-b border-border bg-muted" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-14 animate-pulse rounded bg-muted" />
          </div>
          <div className="mb-2 h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-2 h-3 w-28 animate-pulse rounded bg-muted" />
          <div className="mb-4 space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <div className="flex gap-3">
            <div className="h-3 w-14 animate-pulse rounded bg-muted" />
            <div className="h-3 w-14 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-12 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
