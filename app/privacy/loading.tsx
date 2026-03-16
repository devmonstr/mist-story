import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Skeleton } from "@/components/ui/skeleton"
import { SkeletonText } from "@/components/skeletons"

export default function PrivacyLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="rounded-lg border border-border/40 bg-card p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <SkeletonText lines={3} />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
