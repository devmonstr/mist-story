type CatalogCursorPayload = {
  page: number
}

export function encodeCatalogCursor(page: number) {
  return Buffer.from(JSON.stringify({ page } satisfies CatalogCursorPayload)).toString("base64url")
}

export function decodeCatalogCursor(cursor: string | undefined | null) {
  if (!cursor) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as Partial<CatalogCursorPayload>
    const page = parsed.page
    return typeof page === "number" && Number.isFinite(page) && page > 0
      ? Math.floor(page)
      : null
  } catch {
    return null
  }
}
