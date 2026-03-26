import type {
  AuthChallengeResponse,
  AuthMeResponse,
  AuthUserDto,
  AuthVerifyResponse,
  BookmarkState,
  CatalogSortBy,
  ChapterDto,
  ChapterVersionDto,
  CreateChapterInput,
  CreateNovelInput,
  DiscoverResponse,
  LibraryCatalogResponse,
  MyLibraryResponse,
  MyProfileResponse,
  NotificationDto,
  NotificationsResponse,
  NovelDto,
  ProfileConnectionsResponse,
  ProfileFollowState,
  ProfilePageResponse,
  PublicNovelDetailResponse,
  PublicNovelReaderResponse,
  PublishChapterInput,
  ReorderChaptersInput,
  ReadingProgressState,
  SearchFilterType,
  SearchResponse,
  SearchSortBy,
  SignedNostrEvent,
  UpsertReadingProgressInput,
  UpdateChapterInput,
  UpdateNovelInput,
} from "@mist/shared"
import type { NostrUser } from "@/lib/nostr-types"

export type NotificationSettingsDto = {
  emailNotifications: boolean
  newChapterNotifications: boolean
  commentNotifications: boolean
  followNotifications: boolean
}

export type AppearanceSettingsDto = {
  theme: "light" | "dark" | "system"
  fontSize: "small" | "medium" | "large"
}

export type SecurityActivityDto = {
  id: string
  action: string
  resultCode: string
  detail: string | null
  createdAt: string
}

export type SecuritySettingsDto = {
  npub: string
  pubkey: string
  recentAuthActivity: SecurityActivityDto[]
}

export type ApiKeyDto = {
  id: string
  name: string
  keyPreview: string
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

export type RelayDto = {
  id: string
  url: string
  read: boolean
  write: boolean
  createdAt: string
  updatedAt: string
}

export type IntegrationsSettingsDto = {
  apiKeys: ApiKeyDto[]
  relays: RelayDto[]
}

export type UploadProfileImageResponse = {
  url: string
}

export type CreateApiKeyResponse = {
  apiKey: ApiKeyDto
  token: string
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return ""
  }

  return (
    process.env.INTERNAL_API_URL?.replace(/\/$/, "") ||
    process.env.API_ORIGIN?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`
  )
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: "include",
      headers,
    })
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message
        ? `Unable to reach the API: ${error.message}`
        : "Unable to reach the API."
    )
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new ApiError(body.error || "Request failed", response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function getCurrentUser() {
  return apiFetch<AuthMeResponse>("/api/v1/auth/me").catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }

    throw error
  })
}

export function requestAuthChallenge(pubkey: string) {
  return apiFetch<AuthChallengeResponse>("/api/v1/auth/challenge", {
    method: "POST",
    body: JSON.stringify({ pubkey }),
  })
}

export function verifyAuthChallenge(input: {
  pubkey: string
  challenge: string
  signedEvent: SignedNostrEvent
}) {
  return apiFetch<AuthVerifyResponse>("/api/v1/auth/verify", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function signOutSession() {
  return apiFetch<void>("/api/v1/auth/sign-out", {
    method: "POST",
  })
}

export function fetchMyLibrary() {
  return apiFetch<MyLibraryResponse>("/api/v1/me/library")
}

export function fetchNotifications() {
  return apiFetch<NotificationsResponse>("/api/v1/me/notifications")
}

export function fetchMyProfile() {
  return apiFetch<MyProfileResponse>("/api/v1/me/profile")
}

export function refreshMyProfile() {
  return apiFetch<MyProfileResponse>("/api/v1/me/profile/refresh", {
    method: "POST",
  })
}

export function publishMyProfile(input: {
  profile: NostrUser["profile"]
  signedEvent: SignedNostrEvent & { id: string; sig: string }
}) {
  return apiFetch<MyProfileResponse>("/api/v1/me/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function uploadMyProfileImage(
  assetType: "avatar" | "banner",
  input: {
    image: {
      dataUrl: string
      fileName: string
      mimeType: string
      fileSizeBytes: number
    }
  }
) {
  return apiFetch<UploadProfileImageResponse>(`/api/v1/me/profile/assets/${assetType}`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function fetchNotificationSettings() {
  return apiFetch<NotificationSettingsDto>("/api/v1/me/settings/notifications")
}

export function updateNotificationSettings(input: NotificationSettingsDto) {
  return apiFetch<NotificationSettingsDto>("/api/v1/me/settings/notifications", {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function fetchAppearanceSettings() {
  return apiFetch<AppearanceSettingsDto>("/api/v1/me/settings/appearance")
}

export function updateAppearanceSettings(input: AppearanceSettingsDto) {
  return apiFetch<AppearanceSettingsDto>("/api/v1/me/settings/appearance", {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function fetchSecuritySettings() {
  return apiFetch<SecuritySettingsDto>("/api/v1/me/settings/security")
}

export function fetchIntegrationsSettings() {
  return apiFetch<IntegrationsSettingsDto>("/api/v1/me/settings/integrations")
}

export function createApiKey(input: { name: string }) {
  return apiFetch<CreateApiKeyResponse>("/api/v1/me/settings/api-keys", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function revokeApiKey(apiKeyId: string) {
  return apiFetch<void>(`/api/v1/me/settings/api-keys/${apiKeyId}`, {
    method: "DELETE",
  })
}

export function createRelay(input: { url: string; read: boolean; write: boolean }) {
  return apiFetch<RelayDto>("/api/v1/me/settings/relays", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteRelay(relayId: string) {
  return apiFetch<void>(`/api/v1/me/settings/relays/${relayId}`, {
    method: "DELETE",
  })
}

export function markNotificationAsRead(notificationId: string) {
  return apiFetch<NotificationDto>(`/api/v1/me/notifications/${notificationId}/read`, {
    method: "POST",
  })
}

export function markAllNotificationsAsRead() {
  return apiFetch<{ updatedCount: number }>("/api/v1/me/notifications/read-all", {
    method: "POST",
  })
}

export function deleteNotification(notificationId: string) {
  return apiFetch<void>(`/api/v1/me/notifications/${notificationId}`, {
    method: "DELETE",
  })
}

export function fetchBookmarkState(novelId: string) {
  return apiFetch<BookmarkState>(`/api/v1/me/bookmarks/${novelId}`)
}

export function addBookmark(novelId: string) {
  return apiFetch<BookmarkState>(`/api/v1/me/bookmarks/${novelId}`, {
    method: "PUT",
  })
}

export function removeBookmark(novelId: string) {
  return apiFetch<BookmarkState>(`/api/v1/me/bookmarks/${novelId}`, {
    method: "DELETE",
  })
}

export function fetchReadingProgress(novelId: string) {
  return apiFetch<ReadingProgressState>(`/api/v1/me/reading-progress/${novelId}`)
}

export function updateReadingProgress(input: UpsertReadingProgressInput) {
  return apiFetch<ReadingProgressState>("/api/v1/me/reading-progress", {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function removeReadingProgress(novelId: string) {
  return apiFetch<void>(`/api/v1/me/reading-progress/${novelId}`, {
    method: "DELETE",
  })
}

export function clearReadingProgress() {
  return apiFetch<void>("/api/v1/me/reading-progress", {
    method: "DELETE",
  })
}

export function fetchStudioNovels() {
  return apiFetch<NovelDto[]>("/api/v1/novels")
}

export function fetchLibraryCatalog(input?: {
  query?: string
  sortBy?: CatalogSortBy
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
}) {
  const searchParams = new URLSearchParams()

  if (input?.query?.trim()) {
    searchParams.set("q", input.query.trim())
  }
  if (input?.sortBy && input.sortBy !== "recent") {
    searchParams.set("sort", input.sortBy)
  }
  if (input?.cursor) {
    searchParams.set("cursor", input.cursor)
  }
  if (input?.direction) {
    searchParams.set("direction", input.direction)
  }
  if (input?.page && input.page > 1) {
    searchParams.set("page", String(input.page))
  }
  if (input?.pageSize && input.pageSize !== 18) {
    searchParams.set("pageSize", String(input.pageSize))
  }
  if (input?.genre?.trim()) {
    searchParams.set("genre", input.genre.trim())
  }
  if (input?.workType) {
    searchParams.set("workType", input.workType)
  }
  if (input?.status) {
    searchParams.set("status", input.status)
  }
  if (input?.collection) {
    searchParams.set("collection", input.collection)
  }

  const path = searchParams.size
    ? `/api/v1/library?${searchParams.toString()}`
    : "/api/v1/library"

  return apiFetch<LibraryCatalogResponse>(path)
}

export function fetchDiscoverData(input?: {
  query?: string
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
  collection?: "trending" | "hidden-gems" | "editors-picks" | "new-voices" | null
  sortBy?: "relevance" | "popular" | "recent"
}) {
  const searchParams = new URLSearchParams()

  if (input?.query?.trim()) {
    searchParams.set("q", input.query.trim())
  }
  if (input?.genre?.trim()) {
    searchParams.set("genre", input.genre.trim())
  }
  if (input?.workType) {
    searchParams.set("workType", input.workType)
  }
  if (input?.status) {
    searchParams.set("status", input.status)
  }
  if (input?.collection) {
    searchParams.set("collection", input.collection)
  }
  if (input?.sortBy && input.sortBy !== "recent") {
    searchParams.set("sort", input.sortBy)
  }

  const path = searchParams.size
    ? `/api/v1/discover?${searchParams.toString()}`
    : "/api/v1/discover"

  return apiFetch<DiscoverResponse>(path)
}

export function fetchSearchResults(input: {
  query: string
  filterType?: SearchFilterType
  sortBy?: SearchSortBy
  page?: number
  pageSize?: number
  cursor?: string | null
  direction?: "next" | "prev" | null
  genre?: string | null
  workType?: "ORIGINAL" | "TRANSLATION" | null
  status?: "Ongoing" | "Completed" | "Hiatus" | null
}) {
  const searchParams = new URLSearchParams()
  if (input.query.trim()) {
    searchParams.set("q", input.query.trim())
  }
  if (input.filterType && input.filterType !== "all") {
    searchParams.set("type", input.filterType)
  }
  if (input.sortBy && input.sortBy !== "relevance") {
    searchParams.set("sort", input.sortBy)
  }
  if (input.cursor) {
    searchParams.set("cursor", input.cursor)
  }
  if (input.direction) {
    searchParams.set("direction", input.direction)
  }
  if (input.page && input.page > 1) {
    searchParams.set("page", String(input.page))
  }
  if (input.pageSize && input.pageSize !== 20) {
    searchParams.set("pageSize", String(input.pageSize))
  }
  if (input.genre?.trim()) {
    searchParams.set("genre", input.genre.trim())
  }
  if (input.workType) {
    searchParams.set("workType", input.workType)
  }
  if (input.status) {
    searchParams.set("status", input.status)
  }

  const queryString = searchParams.toString()
  const path = queryString
    ? `/api/v1/discover/search?${queryString}`
    : "/api/v1/discover/search"

  return apiFetch<SearchResponse>(path)
}

export function fetchNovel(novelId: string) {
  return apiFetch<NovelDto>(`/api/v1/novels/${novelId}`)
}

export function fetchPublicNovelDetail(
  novelId: string,
  input?: { chapterPage?: number }
) {
  const searchParams = new URLSearchParams()
  if (input?.chapterPage && input.chapterPage > 1) {
    searchParams.set("chapterPage", String(input.chapterPage))
  }

  const path = searchParams.size
    ? `/api/v1/library/${novelId}?${searchParams.toString()}`
    : `/api/v1/library/${novelId}`

  return apiFetch<PublicNovelDetailResponse>(path)
}

export function fetchPublicNovelChapter(
  novelId: string,
  chapterNumber: string,
  input?: { chapterPage?: number }
) {
  const searchParams = new URLSearchParams()
  if (input?.chapterPage && input.chapterPage > 1) {
    searchParams.set("chapterPage", String(input.chapterPage))
  }

  const path = searchParams.size
    ? `/api/v1/library/${novelId}/chapters/${chapterNumber}?${searchParams.toString()}`
    : `/api/v1/library/${novelId}/chapters/${chapterNumber}`

  return apiFetch<PublicNovelReaderResponse>(path)
}

export function fetchProfilePage(npub: string) {
  return apiFetch<ProfilePageResponse>(`/api/v1/profiles/${npub}`)
}

export function fetchProfileFollowers(npub: string) {
  return apiFetch<ProfileConnectionsResponse>(`/api/v1/profiles/${npub}/followers`)
}

export function fetchProfileFollowing(npub: string) {
  return apiFetch<ProfileConnectionsResponse>(`/api/v1/profiles/${npub}/following`)
}

export function followProfile(npub: string) {
  return apiFetch<ProfileFollowState>(`/api/v1/profiles/${npub}/follow`, {
    method: "PUT",
  })
}

export function unfollowProfile(npub: string) {
  return apiFetch<ProfileFollowState>(`/api/v1/profiles/${npub}/follow`, {
    method: "DELETE",
  })
}

export function createNovel(input: CreateNovelInput) {
  return apiFetch<NovelDto>("/api/v1/novels", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateNovel(novelId: string, input: UpdateNovelInput) {
  return apiFetch<NovelDto>(`/api/v1/novels/${novelId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function fetchNovelChapters(novelId: string) {
  return apiFetch<ChapterDto[]>(`/api/v1/novels/${novelId}/chapters`)
}

export function createChapter(novelId: string, input: CreateChapterInput) {
  return apiFetch<ChapterDto>(`/api/v1/novels/${novelId}/chapters`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function reorderChapters(novelId: string, input: ReorderChaptersInput) {
  return apiFetch<ChapterDto[]>(`/api/v1/novels/${novelId}/chapters/reorder`, {
    method: "PUT",
    body: JSON.stringify(input),
  })
}

export function updateChapter(chapterId: string, input: UpdateChapterInput) {
  return apiFetch<ChapterDto>(`/api/v1/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteChapter(chapterId: string) {
  return apiFetch<void>(`/api/v1/chapters/${chapterId}`, {
    method: "DELETE",
  })
}

export function publishChapter(chapterId: string, input: PublishChapterInput) {
  return apiFetch<ChapterVersionDto>(`/api/v1/chapters/${chapterId}/publish`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function toNostrUser(user: AuthUserDto): NostrUser {
  return {
    pubkey: user.pubkey,
    npub: user.npub,
    profile: user.profile
      ? {
          name: user.profile.name ?? undefined,
          display_name: user.profile.display_name ?? undefined,
          picture: user.profile.picture ?? undefined,
          banner: user.profile.banner ?? undefined,
          about: user.profile.about ?? undefined,
          nip05: user.profile.nip05 ?? undefined,
          lud16: user.profile.lud16 ?? undefined,
          website: user.profile.website ?? undefined,
        }
      : undefined,
  }
}
