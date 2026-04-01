import { Users } from "lucide-react"

export function ProfileHeaderSkeleton() {
  return (
    <div className="border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-muted border-2 border-background shadow-sm -mt-12 sm:-mt-16">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1 pt-2">
              <div className="h-8 w-48 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="mt-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="h-10 w-28 animate-pulse rounded bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded bg-muted" />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function NovelListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <article
          key={i}
          className="flex flex-col gap-4 border border-border/40 bg-card p-6 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 animate-pulse rounded bg-muted" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-16 animate-pulse rounded bg-muted" />
                </div>
                <div className="mt-2 h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="mt-1 h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-right sm:items-end">
            <div className="flex items-center gap-4">
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </article>
      ))}
    </div>
  )
}
