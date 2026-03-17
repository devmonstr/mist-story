import { ChevronRight } from "lucide-react"

export function CategoriesSkeleton() {
  return (
    <section className="border-b border-border/40 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <div className="h-7 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col justify-between rounded-lg border border-border/40 p-8">
              <div>
                <div className="h-6 w-32 animate-pulse rounded bg-muted" />
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
          ))}
        </div>
      </div>
    </section>
  )
}
