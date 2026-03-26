import type { Metadata } from "next"
import { fetchPublicNovelChapter } from "@/lib/api"
import { buildCanonicalUrl, resolveMetadataImageUrl } from "@/lib/site-url"
import { ReadPageClient } from "./read-page-client"

async function loadReaderPageData(id: string, chapter: string) {
  try {
    const data = await fetchPublicNovelChapter(id, chapter)
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
  const result = await loadReaderPageData(id, chapter)

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

export default function ReadPage({
  params,
}: {
  params: Promise<{ id: string; chapter: string }>
}) {
  return <ReadPageClient params={params} />
}
