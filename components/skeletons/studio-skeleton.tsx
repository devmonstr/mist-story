import { FileText } from "lucide-react"

export function StudioStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="border border-border/40 bg-card p-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-8 w-16 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function NovelListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <article
          key={i}
          className="flex flex-col gap-4 border border-border/40 bg-card p-4 sm:flex-row sm:items-start sm:justify-between sm:p-6"
        >
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 animate-pulse items-center justify-center bg-muted" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="mt-2 space-y-1">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
                <div className="mt-3 flex flex-wrap gap-4">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:shrink-0">
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded bg-muted" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function EmptyStateSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileText className="h-12 w-12 text-muted-foreground/50" />
      <div className="mt-4 h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-10 w-32 animate-pulse rounded bg-muted" />
    </div>
  )
}
