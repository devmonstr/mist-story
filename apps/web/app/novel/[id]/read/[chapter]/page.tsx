import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { fetchPublicNovelChapter } from "@/lib/api"
import { buildCanonicalUrl, resolveMetadataImageUrl } from "@/lib/site-url"
import { ReadPageClient } from "./read-page-client"

function parseChapterNumber(chapter: string): number {
  const parsed = Number.parseInt(chapter, 10)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return -1
  }
  return parsed
}

async function loadReaderPageData(novelId: string, chapterNumber: number) {
  try {
    const data = await fetchPublicNovelChapter(novelId, String(chapterNumber))
    return {
      data,
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load this chapter right now.",
    }
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>
}): Promise<Metadata> {
  const { id, chapter } = await params
  const chapterNumber = parseChapterNumber(chapter)

  if (chapterNumber < 1) {
    return {
      title: "Chapter unavailable",
      description: "This chapter could not be loaded right now.",
    }
  }

  const result = await loadReaderPageData(id, chapterNumber)

  if (!result.data) {
    return {
      title: "Chapter unavailable",
      description: "This chapter could not be loaded right now.",
    }
  }

  const { novel, author, chapter: currentChapter } = result.data
  const canonicalUrl = buildCanonicalUrl(
    `/novel/${novel.slug}/read/${currentChapter.number}`
  )
  const description =
    currentChapter.previewText.trim() ||
    `Read Chapter ${currentChapter.number} of ${novel.title} by ${author.displayName} on Mist Story.`
  const coverImage = novel.coverStorageKey
    ? resolveMetadataImageUrl(`/api/v1/novels/${novel.id}/cover`)
    : resolveMetadataImageUrl(novel.coverUrl)
  const images = coverImage ? [{ url: coverImage, alt: `${novel.title} cover` }] : undefined

  return {
    title: `${currentChapter.title} | ${novel.title}`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: `${currentChapter.title} | ${novel.title}`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${currentChapter.title} | ${novel.title}`,
      description,
      images,
    },
  }
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>
}) {
  const { id, chapter } = await params
  const chapterNumber = parseChapterNumber(chapter)

  // Redirect to 404 if chapter number is invalid
  if (chapterNumber < 1) {
    notFound()
  }

  // Load chapter data once and pass to client to prevent duplicate fetch
  const result = await loadReaderPageData(id, chapterNumber)

  if (!result.data) {
    // Show error state in client component
    return (
      <ReadPageClient
        params={Promise.resolve({ id, chapter: String(chapterNumber) })}
        initialError={result.error}
      />
    )
  }

  // If the URL chapter doesn't match the canonical number, redirect
  if (result.data.chapter.number !== chapterNumber) {
    redirect(`/novel/${result.data.novel.slug}/read/${result.data.chapter.number}`)
  }

  return (
    <ReadPageClient
      params={Promise.resolve({ id, chapter: String(chapterNumber) })}
      initialData={result.data}
    />
  )
}
