import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FormSkeleton, Skeleton } from "@/components/skeletons"

export default function ContactLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <div className="rounded-lg border border-border/40 bg-card p-6 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <FormSkeleton fields={4} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
