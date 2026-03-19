import type {
  AuthChallengeResponse,
  AuthMeResponse,
  AuthUserDto,
  AuthVerifyResponse,
  ChapterDto,
  ChapterVersionDto,
  CreateChapterInput,
  CreateNovelInput,
  MyLibraryResponse,
  NovelDto,
  PublishChapterInput,
  SignedNostrEvent,
  UpdateChapterInput,
  UpdateNovelInput,
} from "@mist/shared"
import type { NostrUser } from "@/lib/nostr-types"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000"

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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

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

export function fetchStudioNovels() {
  return apiFetch<NovelDto[]>("/api/v1/novels")
}

export function fetchNovel(novelId: string) {
  return apiFetch<NovelDto>(`/api/v1/novels/${novelId}`)
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

export function updateChapter(chapterId: string, input: UpdateChapterInput) {
  return apiFetch<ChapterDto>(`/api/v1/chapters/${chapterId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
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
          about: user.profile.about ?? undefined,
          nip05: user.profile.nip05 ?? undefined,
          lud16: user.profile.lud16 ?? undefined,
          website: user.profile.website ?? undefined,
        }
      : undefined,
  }
}
