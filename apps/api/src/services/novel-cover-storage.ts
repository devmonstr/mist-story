import {
  createR2MediaConfig,
  deleteMediaObject,
  getMediaObjectOrNull,
  MediaImageProcessingError,
  MediaImageTooLargeError,
  uploadManagedNovelCover,
  type R2MediaConfig,
} from "@myth/media"
import type { CreateNovelInput, UpdateNovelInput } from "@myth/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const MAX_COVER_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const COVER_UPLOAD_TIMEOUT_MS = 15_000

function getNovelCoverMediaConfig(): R2MediaConfig {
  const publicBaseUrl = env.R2_ENDPOINT ?? env.R2_PUBLIC_BASE_URL

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !publicBaseUrl
  ) {
    throw new HttpError(500, "Cloudflare R2 is not configured for cover uploads")
  }

  return createR2MediaConfig({
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicBaseUrl,
  })
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) {
    throw new HttpError(400, "Invalid cover image payload")
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  }
}

function normalizeUpload(input: CreateNovelInput | UpdateNovelInput) {
  const upload = input.coverUpload
  if (!upload) {
    return null
  }

  if (!ALLOWED_IMAGE_MIME_TYPES.has(upload.mimeType)) {
    throw new HttpError(400, "Cover image must be JPG, PNG, or WEBP")
  }

  if (upload.fileSizeBytes > MAX_COVER_FILE_SIZE_BYTES) {
    throw new HttpError(400, "Cover image must be smaller than 5MB")
  }

  const parsed = parseDataUrl(upload.dataUrl)
  if (parsed.mimeType !== upload.mimeType) {
    throw new HttpError(400, "Cover image MIME type mismatch")
  }

  if (parsed.buffer.byteLength !== upload.fileSizeBytes) {
    throw new HttpError(400, "Cover image size mismatch")
  }

  return {
    ...upload,
    buffer: parsed.buffer,
  }
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError"
}

export async function uploadNovelCoverAsset(input: {
  userId: string
  novelId?: string
  payload: CreateNovelInput | UpdateNovelInput
}) {
  const upload = normalizeUpload(input.payload)
  if (!upload) {
    return null
  }

  const config = getNovelCoverMediaConfig()
  const abortController = new AbortController()
  const timeout = setTimeout(() => abortController.abort(), COVER_UPLOAD_TIMEOUT_MS)
  let uploadedCover: Awaited<ReturnType<typeof uploadManagedNovelCover>>

  try {
    uploadedCover = await uploadManagedNovelCover(
      config,
      {
        userId: input.userId,
        novelId: input.novelId,
        buffer: upload.buffer,
        maxFileSizeBytes: MAX_COVER_FILE_SIZE_BYTES,
      },
      { abortSignal: abortController.signal }
    )
  } catch (error) {
    if (isAbortError(error)) {
      throw new HttpError(504, "Cover upload timed out. Please try again.")
    }

    if (error instanceof MediaImageTooLargeError) {
      throw new HttpError(400, "Optimized cover image is still larger than 5MB")
    }

    if (error instanceof MediaImageProcessingError) {
      throw new HttpError(400, "Cover image could not be processed")
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }

  return {
    coverUrl: uploadedCover.url,
    coverStorageKey: uploadedCover.key,
    coverMimeType: uploadedCover.mimeType,
    coverOriginalName: upload.fileName,
    coverFileSizeBytes: uploadedCover.fileSizeBytes,
  }
}

export async function deleteNovelCoverAsset(coverStorageKey: string | null | undefined) {
  if (!coverStorageKey) {
    return
  }

  try {
    const config = getNovelCoverMediaConfig()
    await deleteMediaObject(config, coverStorageKey)
  } catch (error) {
    console.error("[novel-cover] failed to delete old cover asset", error)
  }
}

export async function getNovelCoverAsset(coverStorageKey: string) {
  const config = getNovelCoverMediaConfig()
  return getMediaObjectOrNull(config, coverStorageKey)
}
