import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FAQSkeleton } from "@/components/skeletons"
import { Skeleton } from "@/components/ui/skeleton"

export default function SupportLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-32 mb-8" />
          <FAQSkeleton count={6} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
