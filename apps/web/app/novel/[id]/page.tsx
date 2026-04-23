import type { Metadata } from "next"
import { fetchPublicNovelDetail } from "@/lib/api"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { NovelShell } from "./novel-shell"
import { NovelHeader } from "./novel-header"
import { NovelAbout } from "./novel-about"
import { ChapterList } from "./chapter-list"
import { AuthorSidebar } from "./author-sidebar"
import { Button } from "@/components/ui/button"
import { buildCanonicalUrl, resolveMetadataImageUrl } from "@/lib/site-url"
import Link from "next/link"

function parsePositiveInt(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function loadNovelPageData(id: string, chapterPage = 1) {
  try {
    const payload = await fetchPublicNovelDetail(id, { chapterPage })
    return {
      data: payload,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load this story right now.",
    }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await loadNovelPageData(id)

  if (!result.data) {
    return {
      title: "Story unavailable",
      description: "This story could not be loaded right now.",
    }
  }

  const { novel, author } = result.data
  const canonicalUrl = buildCanonicalUrl(`/novel/${novel.slug}`)
  const summary = novel.summary.trim()
  const description = summary || `Read ${novel.title} by ${author.displayName} on Myth Story.`
  const coverImage = novel.coverStorageKey
    ? resolveMetadataImageUrl(`/api/v1/novels/${novel.id}/cover`)
    : resolveMetadataImageUrl(novel.coverUrl)
  const images = coverImage ? [{ url: coverImage, alt: `${novel.title} cover` }] : undefined

  return {
    title: novel.title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: novel.title,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: novel.title,
      description,
      images,
    },
  }
}

export default async function NovelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ chapterPage?: string }>
}) {
  const { id } = await params
  const { chapterPage } = await searchParams
  const result = await loadNovelPageData(id, parsePositiveInt(chapterPage, 1))

  if (!result.data) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-md rounded-2xl border border-border/60 bg-card px-6 py-8 text-center shadow-sm">
            <p className="font-serif text-2xl text-foreground">Story unavailable</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.error}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button asChild>
                <Link href="/library">Back to Library</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/search">Search Stories</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const { novel, author, chapterList, chapters, viewer } = result.data

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <NovelShell>
          <NovelHeader
            novel={novel}
            author={author}
            viewer={viewer}
          />

          <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <NovelAbout novel={novel} />
                  <ChapterList novel={novel} chapters={chapters} chapterList={chapterList} />
                </div>

                <div className="lg:col-span-1">
                  <AuthorSidebar novel={novel} author={author} />
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
