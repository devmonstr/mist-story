import { Buffer } from "node:buffer"
import {
  createR2MediaConfig,
  deleteObjectsByPrefix,
  deriveManagedProfileImagePrefixFromUrl,
  uploadManagedProfileImage,
  type ManagedProfileImageUploadResult,
  type R2MediaConfig,
} from "@mist/media"
import type { ProfileImageAssetType, UploadProfileImageInput } from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const MAX_PROFILE_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function getProfileImageMediaConfig(): R2MediaConfig {
  const publicBaseUrl = env.R2_ENDPOINT ?? env.R2_PUBLIC_BASE_URL

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !publicBaseUrl
  ) {
    throw new HttpError(500, "Cloudflare R2 is not configured for profile image uploads")
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
    throw new HttpError(400, "Invalid profile image payload")
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  }
}

function normalizeUpload(input: UploadProfileImageInput["image"]) {
  if (!ALLOWED_IMAGE_MIME_TYPES.has(input.mimeType)) {
    throw new HttpError(400, "Profile image must be JPG, PNG, or WEBP")
  }

  if (input.fileSizeBytes > MAX_PROFILE_IMAGE_FILE_SIZE_BYTES) {
    throw new HttpError(400, "Profile image must be smaller than 5MB")
  }

  const parsed = parseDataUrl(input.dataUrl)
  if (parsed.mimeType !== input.mimeType) {
    throw new HttpError(400, "Profile image MIME type mismatch")
  }

  if (parsed.buffer.byteLength !== input.fileSizeBytes) {
    throw new HttpError(400, "Profile image size mismatch")
  }

  return {
    ...input,
    buffer: parsed.buffer,
  }
}

export async function uploadProfileImageAsset(input: {
  userId: string
  assetType: ProfileImageAssetType
  payload: UploadProfileImageInput["image"]
}): Promise<ManagedProfileImageUploadResult> {
  const config = getProfileImageMediaConfig()
  const upload = normalizeUpload(input.payload)

  return uploadManagedProfileImage(config, {
    userId: input.userId,
    assetType: input.assetType,
    fileName: upload.fileName,
    mimeType: upload.mimeType,
    buffer: upload.buffer,
  })
}

export async function deleteManagedProfileImageAsset(url: string | null | undefined) {
  if (!url) {
    return
  }

  try {
    const config = getProfileImageMediaConfig()
    const prefix = deriveManagedProfileImagePrefixFromUrl(config, url)
    if (!prefix) {
      return
    }

    await deleteObjectsByPrefix(config, prefix)
  } catch (error) {
    console.error("[profile-image] failed to delete old profile image asset", error)
  }
}
