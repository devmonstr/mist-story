import { BookOpen } from "lucide-react"

export function NovelHeaderSkeleton() {
  return (
    <section className="border-b border-border/40 bg-muted/30 px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {/* Cover Placeholder */}
          <div className="flex justify-center lg:justify-start">
            <div className="flex aspect-[2/3] w-full max-w-[280px] animate-pulse items-center justify-center border border-border bg-card">
              <div className="p-6 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div className="mt-4 h-4 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          </div>

          {/* Novel Info */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
            </div>

            <div className="mt-4 h-10 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-6 space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>

            {/* Stats */}
            <div className="mt-6 flex flex-wrap gap-6">
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-10 w-32 animate-pulse rounded bg-muted" />
              <div className="h-10 w-40 animate-pulse rounded bg-muted" />
              <div className="h-10 w-24 animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function ChapterListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-4"
        >
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-48 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  )
}

export function AuthorSidebarSkeleton() {
  return (
    <div className="sticky top-8 space-y-8">
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
  )
}
