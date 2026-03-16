import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonText } from "@/components/skeletons"

import { cn } from "@/lib/utils"

export default function AboutLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="grid gap-6 md:grid-cols-3 mb-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-1/2" />
                <SkeletonText lines={2} />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-24" />
            <SkeletonText lines={3} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
