import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NovelCardGridSkeleton } from "@/components/skeletons"

import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <NovelCardGridSkeleton count={9} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
