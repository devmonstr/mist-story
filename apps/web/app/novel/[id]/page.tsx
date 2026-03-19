import { Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NovelShell } from "./novel-shell"
import { NovelHeader } from "./novel-header"
import { NovelAbout } from "./novel-about"
import { ChapterList } from "./chapter-list"
import { AuthorSidebar } from "./author-sidebar"
import { NovelHeaderSkeleton } from "@/components/skeletons/novel-header-skeleton"
import { ChapterListSkeleton } from "@/components/skeletons/novel-header-skeleton"
import { AuthorSidebarSkeleton } from "@/components/skeletons/novel-header-skeleton"

export default function NovelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <NovelShell params={params}>
          <Suspense fallback={<NovelHeaderSkeleton />}>
            <NovelHeader params={params} />
          </Suspense>

          <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2">
                  <Suspense fallback={<NovelAboutSkeleton />}>
                    <NovelAbout params={params} />
                  </Suspense>
                  <Suspense fallback={<ChapterListSkeleton />}>
                    <ChapterList params={params} />
                  </Suspense>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                  <Suspense fallback={<AuthorSidebarSkeleton />}>
                    <AuthorSidebar params={params} />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>
        </NovelShell>
      </main>
      <Footer />
    </div>
  )
}

function NovelAboutSkeleton() {
  return (
    <div className="mb-10">
      <div className="h-7 w-40 animate-pulse rounded bg-muted" />
      <div className="mt-4 space-y-2">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  )
}
