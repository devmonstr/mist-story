const DEFAULT_SITE_URL = "http://localhost:3000"

export function getConfiguredSiteUrl() {
  const rawValue =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    DEFAULT_SITE_URL

  try {
    return new URL(rawValue)
  } catch {
    return new URL(DEFAULT_SITE_URL)
  }
}

export function buildCanonicalUrl(pathname = "/") {
  const siteUrl = getConfiguredSiteUrl()
  return new URL(pathname, siteUrl)
}

export function resolveMetadataImageUrl(
  pathOrUrl: string | null | undefined
) {
  if (!pathOrUrl) {
    return null
  }

  try {
    return new URL(pathOrUrl).toString()
  } catch {
    return buildCanonicalUrl(pathOrUrl).toString()
  }
}
