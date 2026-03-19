export function resolveNovelCoverSrc(input: {
  novelId: string
  coverUrl: string
  coverStorageKey: string | null
}) {
  if (input.coverStorageKey) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "")
    if (apiBaseUrl) {
      return `${apiBaseUrl}/api/v1/novels/${input.novelId}/cover`
    }
  }

  return input.coverUrl || null
}
