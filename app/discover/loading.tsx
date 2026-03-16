import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CategoryCardSkeleton, CollectionCardSkeleton } from "@/components/skeletons"

export default function DiscoverLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Discover</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CategoryCardSkeleton />
            <CategoryCardSkeleton />
            <CategoryCardSkeleton />
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CollectionCardSkeleton />
            <CollectionCardSkeleton />
            <CollectionCardSkeleton />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
