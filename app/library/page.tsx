import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { LibraryShell } from "./library-shell"
import { StoriesGrid } from "./stories-grid"
import { StoriesGridSkeleton } from "./stories-grid-skeleton"

export default function LibraryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <LibraryShell>
          <Suspense fallback={<StoriesGridSkeleton />}>
            <StoriesGrid />
          </Suspense>
        </LibraryShell>
      </main>
      <Footer />
    </div>
  )
}
