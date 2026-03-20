export function resolveNovelCoverSrc(input: {
  novelId: string
  coverUrl: string
  coverStorageKey: string | null
}) {
  if (input.coverStorageKey) {
    return `/api/v1/novels/${input.novelId}/cover`
  }

  return input.coverUrl || null
}
