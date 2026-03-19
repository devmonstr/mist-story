import { Readable } from "node:stream"
import {
  createNovelForAuthor,
  findNovelByIdOrSlug,
  listNovelsForAuthor,
  listPublishedNovels,
  serializeNovel,
  updateNovelForAuthor,
} from "@mist/db"
import type { Response } from "express"
import type { CreateNovelInput, UpdateNovelInput } from "@mist/shared"
import { HttpError } from "../utils/http-error"
import {
  deleteNovelCoverAsset,
  getNovelCoverAsset,
  uploadNovelCoverAsset,
} from "./novel-cover-storage"

function resolveNovelStatus(
  status: CreateNovelInput["status"] | UpdateNovelInput["status"],
  isComplete: boolean | undefined
) {
  if (isComplete === true) {
    return "Completed" as const
  }

  if (isComplete === false && status === "Completed") {
    return "Ongoing" as const
  }

  return status ?? "Ongoing"
}

export async function listNovels(currentUserId?: string) {
  const novels = currentUserId
    ? await listNovelsForAuthor(currentUserId)
    : await listPublishedNovels()

  return novels.map(serializeNovel)
}

export async function getNovel(
  identifier: string,
  currentUserId?: string
) {
  const novel = await findNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }
  if (novel.visibility !== "PUBLISHED" && novel.authorId !== currentUserId) {
    throw new HttpError(404, "Novel not found")
  }

  return serializeNovel(novel)
}

export async function streamNovelCover(
  identifier: string,
  currentUserId: string | undefined,
  response: Response
) {
  const novel = await findNovelByIdOrSlug(identifier)
  if (!novel) {
    throw new HttpError(404, "Novel not found")
  }

  const canAccess =
    novel.visibility === "PUBLISHED" || novel.authorId === currentUserId

  if (!canAccess) {
    throw new HttpError(404, "Novel cover not found")
  }

  if (novel.coverStorageKey) {
    const object = await getNovelCoverAsset(novel.coverStorageKey)
    if (!object.Body) {
      throw new HttpError(404, "Novel cover not found")
    }

    response.setHeader("Content-Type", object.ContentType ?? "application/octet-stream")
    response.setHeader(
      "Cache-Control",
      novel.visibility === "PUBLISHED"
        ? "public, max-age=3600, stale-while-revalidate=86400"
        : "private, max-age=300"
    )
    if (object.ContentLength !== undefined) {
      response.setHeader("Content-Length", object.ContentLength.toString())
    }
    if (object.ETag) {
      response.setHeader("ETag", object.ETag)
    }

    const body = object.Body as
      | Readable
      | { transformToByteArray?: () => Promise<Uint8Array> }

    if (body instanceof Readable) {
      body.pipe(response)
      return
    }

    if (typeof body.transformToByteArray === "function") {
      const bytes = await body.transformToByteArray()
      response.end(Buffer.from(bytes))
      return
    }

    throw new HttpError(500, "Unsupported cover asset stream")
  }

  if (novel.coverUrl) {
    response.redirect(novel.coverUrl)
    return
  }

  throw new HttpError(404, "Novel cover not found")
}

export async function createNovel(userId: string, input: CreateNovelInput) {
  const uploadedCover = await uploadNovelCoverAsset({
    userId,
    payload: input,
  })

  const created = await createNovelForAuthor(userId, {
    title: input.title,
    summary: input.summary,
    genre: input.genre,
    workType: input.workType,
    subgenres: input.subgenres,
    tags: input.tags,
    authorDisplayName: input.authorDisplayName,
    translatorName: input.translatorName,
    status: resolveNovelStatus(input.status, input.isComplete),
    visibility: input.visibility,
    contentWarning: input.contentWarning,
    updateNote: input.updateNote,
    publishedAt: input.visibility === "PUBLISHED" ? new Date() : null,
    coverUrl: uploadedCover?.coverUrl ?? input.coverUrl,
    coverStorageKey: uploadedCover?.coverStorageKey ?? null,
    coverMimeType: uploadedCover?.coverMimeType ?? null,
    coverOriginalName: uploadedCover?.coverOriginalName ?? null,
    coverFileSizeBytes: uploadedCover?.coverFileSizeBytes ?? null,
  })
  return serializeNovel(created)
}

export async function updateNovel(
  userId: string,
  novelId: string,
  input: UpdateNovelInput
) {
  const existing = await findNovelByIdOrSlug(novelId)
  if (!existing) {
    throw new HttpError(404, "Novel not found")
  }

  const uploadedCover = await uploadNovelCoverAsset({
    userId,
    novelId,
    payload: input,
  })

  const shouldClearCover = input.clearCover === true && !uploadedCover
  if (uploadedCover || shouldClearCover) {
    await deleteNovelCoverAsset(existing.coverStorageKey)
  }

  const nextStatus = resolveNovelStatus(
    input.status ?? existing.status,
    input.isComplete
  )
  const nextVisibility = input.visibility ?? existing.visibility

  const nextCoverUrl = uploadedCover
    ? uploadedCover.coverUrl
    : shouldClearCover
      ? ""
      : input.coverUrl ?? existing.coverUrl

  const updated = await updateNovelForAuthor(userId, novelId, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.genre !== undefined ? { genre: input.genre } : {}),
    ...(input.workType !== undefined ? { workType: input.workType } : {}),
    ...(input.subgenres !== undefined ? { subgenres: input.subgenres } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.authorDisplayName !== undefined
      ? { authorDisplayName: input.authorDisplayName }
      : {}),
    ...(input.translatorName !== undefined
      ? { translatorName: input.translatorName }
      : {}),
    ...(input.status !== undefined || input.isComplete !== undefined
      ? { status: nextStatus }
      : {}),
    ...(input.visibility !== undefined ? { visibility: nextVisibility } : {}),
    ...(input.visibility !== undefined
      ? {
          publishedAt:
            nextVisibility === "PUBLISHED"
              ? existing.publishedAt ?? new Date()
              : existing.publishedAt,
        }
      : {}),
    ...(input.contentWarning !== undefined
      ? { contentWarning: input.contentWarning }
      : {}),
    ...(input.updateNote !== undefined ? { updateNote: input.updateNote } : {}),
    ...(uploadedCover || shouldClearCover || input.coverUrl !== undefined
      ? { coverUrl: nextCoverUrl }
      : {}),
    ...(uploadedCover
      ? {
          coverStorageKey: uploadedCover.coverStorageKey,
          coverMimeType: uploadedCover.coverMimeType,
          coverOriginalName: uploadedCover.coverOriginalName,
          coverFileSizeBytes: uploadedCover.coverFileSizeBytes,
        }
      : shouldClearCover
        ? {
            coverStorageKey: null,
            coverMimeType: null,
            coverOriginalName: null,
            coverFileSizeBytes: null,
          }
        : {}),
  })
  return serializeNovel(updated)
}
