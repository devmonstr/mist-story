import { randomUUID } from "node:crypto"
import {
  getPublicMediaUrl,
  putMediaObject,
  type MediaOperationOptions,
  type R2MediaConfig,
} from "./r2"
import { normalizeImageToWebp } from "./image-processing"

export type ManagedNovelCoverUploadInput = {
  userId: string
  novelId?: string
  buffer: Buffer
  maxFileSizeBytes: number
}

export type ManagedNovelCoverUploadResult = {
  key: string
  url: string
  mimeType: "image/webp"
  fileSizeBytes: number
}

const NOVEL_COVER_CACHE_CONTROL = "public, max-age=31536000, immutable"
const NOVEL_COVER_OUTPUT_WIDTH = 1200
const NOVEL_COVER_OUTPUT_HEIGHT = 1800
const NOVEL_COVER_OUTPUT_QUALITIES = [86, 78, 70, 62]

function buildNovelCoverKey(input: {
  userId: string
  novelId?: string
  assetId: string
}) {
  return `novel-covers/${input.userId}/${input.novelId ?? "draft"}/${input.assetId}.webp`
}

export async function uploadManagedNovelCover(
  config: R2MediaConfig,
  input: ManagedNovelCoverUploadInput,
  options?: MediaOperationOptions
): Promise<ManagedNovelCoverUploadResult> {
  const normalized = await normalizeImageToWebp({
    buffer: input.buffer,
    width: NOVEL_COVER_OUTPUT_WIDTH,
    height: NOVEL_COVER_OUTPUT_HEIGHT,
    fit: "cover",
    qualities: NOVEL_COVER_OUTPUT_QUALITIES,
    maxSizeBytes: input.maxFileSizeBytes,
  })
  const key = buildNovelCoverKey({
    userId: input.userId,
    novelId: input.novelId,
    assetId: randomUUID(),
  })

  await putMediaObject(
    config,
    {
      key,
      body: normalized.buffer,
      contentType: normalized.mimeType,
      cacheControl: NOVEL_COVER_CACHE_CONTROL,
    },
    options
  )

  return {
    key,
    url: getPublicMediaUrl(config, key),
    mimeType: normalized.mimeType,
    fileSizeBytes: normalized.fileSizeBytes,
  }
}
