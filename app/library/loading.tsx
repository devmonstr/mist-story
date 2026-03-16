import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NovelCardGridSkeleton } from "@/components/skeletons"

import { Skeleton } from "@/components/ui/skeleton"

import { cn } from "@/lib/utils"

export default function LibraryLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="mb-4 h-12 w-32" />
            <Skeleton className="mb-8 h-6 w-96" />
            <Skeleton className="h-10 max-w-2xl" />
          </div>
        </section>

        {/* Stories Grid */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
            <NovelCardGridSkeleton count={6} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
