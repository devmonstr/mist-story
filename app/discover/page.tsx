import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { DiscoverShell } from "./discover-shell"
import { CategoriesGrid } from "./categories-grid"
import { CollectionsGrid } from "./collections-grid"
import { CategoriesSkeleton } from "./categories-skeleton"
import { CollectionsSkeleton } from "./collections-skeleton"

export default function DiscoverPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <DiscoverShell>
          <Suspense fallback={<CategoriesSkeleton />}>
            <CategoriesGrid />
          </Suspense>
          <Suspense fallback={<CollectionsSkeleton />}>
            <CollectionsGrid />
          </Suspense>
        </DiscoverShell>
      </main>
      <Footer />
    </div>
  )
}
