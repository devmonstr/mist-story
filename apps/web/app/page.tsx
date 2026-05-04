import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { HeroSection } from "@/components/hero-section"
import { HomeDiscoverySections } from "@/components/home-discovery-sections"
import { fetchHomeData, type HomeResponse, type HomeShelfDto } from "@/lib/api"

function getShelfByIds(shelves: HomeShelfDto[], ids: string[]) {
  return shelves.find((shelf) => ids.includes(shelf.id))
}

function selectShelfGroup(homeData: HomeResponse | null, idsList: string[][], limit: number) {
  if (!homeData) {
    return []
  }

  const seen = new Set<string>()
  const matches = idsList
    .map((ids) => getShelfByIds(homeData.shelves, ids))
    .filter((shelf): shelf is HomeShelfDto => Boolean(shelf))
    .filter((shelf) => {
      if (seen.has(shelf.id)) {
        return false
      }

      seen.add(shelf.id)
      return true
    })

  if (matches.length >= limit) {
    return matches.slice(0, limit)
  }

  for (const shelf of homeData.shelves) {
    if (matches.length >= limit) {
      break
    }

    if (seen.has(shelf.id)) {
      continue
    }

    matches.push(shelf)
    seen.add(shelf.id)
  }

  return matches
}

async function loadHomePageData() {
  try {
    return await fetchHomeData()
  } catch (error) {
    console.error("[home] failed to load home data", error)
    return null
  }
}

export default async function Home() {
  const homeData = await loadHomePageData()
  const rankingShelves = selectShelfGroup(
    homeData,
    [["trending"], ["new-releases", "fresh-chapters"], ["hidden-gems"], ["new-voices"]],
    3,
  )
  const discoveryShelves = selectShelfGroup(
    homeData,
    [["trending"], ["new-releases", "fresh-chapters"], ["hidden-gems"], ["new-voices"]],
    4,
  )
  const featuredNovel =
    homeData?.hero.featuredNovel ?? rankingShelves[0]?.novels[0] ?? discoveryShelves[0]?.novels[0] ?? null

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection
          featuredNovel={featuredNovel}
          rankingShelves={rankingShelves}
          genres={homeData?.genres ?? []}
        />
        <HomeDiscoverySections
          generatedAt={homeData?.generatedAt ?? null}
          stats={homeData?.stats ?? null}
          shelves={discoveryShelves}
          genres={homeData?.genres ?? []}
        />
      </main>
      <Footer />
    </div>
  )
}
