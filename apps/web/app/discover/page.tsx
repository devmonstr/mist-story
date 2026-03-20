import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { loadDiscoverData } from "./discover-data"
import { DiscoverShell } from "./discover-shell"
import { CategoriesGrid } from "./categories-grid"
import { CollectionsGrid } from "./collections-grid"

export const dynamic = "force-dynamic"

function normalizeWorkType(value?: string) {
  return value === "ORIGINAL" || value === "TRANSLATION" ? value : null
}

function normalizeStatus(value?: string) {
  return value === "Ongoing" || value === "Completed" || value === "Hiatus" ? value : null
}

function normalizeCollection(value?: string) {
  return value === "trending" ||
    value === "hidden-gems" ||
    value === "editors-picks" ||
    value === "new-voices"
    ? value
    : null
}

function normalizeSort(value?: string) {
  return value === "popular" || value === "recent" || value === "relevance"
    ? value
    : "recent"
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const q = typeof params.q === "string" ? params.q : undefined
  const genre = typeof params.genre === "string" ? params.genre : undefined
  const workType = normalizeWorkType(typeof params.workType === "string" ? params.workType : undefined)
  const status = normalizeStatus(typeof params.status === "string" ? params.status : undefined)
  const collection = normalizeCollection(
    typeof params.collection === "string" ? params.collection : undefined
  )
  const sortBy = normalizeSort(typeof params.sort === "string" ? params.sort : undefined)
  const data = await loadDiscoverData({
    query: q,
    genre,
    workType,
    status,
    collection,
    sortBy,
  })

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <DiscoverShell activeFilters={data.activeFilters}>
          <CategoriesGrid categories={data.genres} />
          <CollectionsGrid collections={data.collections} />
        </DiscoverShell>
      </main>
      <Footer />
    </div>
  )
}
