import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BookmarkListSkeleton } from "@/components/skeletons"

export default function HistoryLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-8">Reading History</h1>
          <BookmarkListSkeleton count={10} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
