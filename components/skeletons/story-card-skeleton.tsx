export function StoryCardSkeleton() {
  return (
    <div className="flex flex-col border border-border/40 bg-card p-6">
      <div className="flex-1">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mb-2 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-4 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-4">
        <div className="flex gap-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
