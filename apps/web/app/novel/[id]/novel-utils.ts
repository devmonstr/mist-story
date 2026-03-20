export function stripHtmlTags(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function estimateWordCountFromHtml(html: string) {
  const text = stripHtmlTags(html)
  if (!text) {
    return 0
  }

  return text.split(/\s+/).filter(Boolean).length
}

export function estimateReadTimeFromWords(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 250))
}

export function chapterExcerptFromHtml(html: string, maxLength = 160) {
  const text = stripHtmlTags(html)

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trimEnd()}...`
}

export function formatPublishedDate(value: string | null | undefined) {
  if (!value) {
    return "Draft"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

