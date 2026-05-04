import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import type { ProfileImageAssetType } from "@myth/shared"
import { normalizeImageToWebp } from "./image-processing"
import {
  deleteMediaObject,
  getPublicMediaUrl,
  putMediaObject,
  readMediaObjectBuffer,
  type R2MediaConfig,
} from "./r2"

export type ManagedProfileImageUploadInput = {
  userId: string
  assetType: ProfileImageAssetType
  fileName: string
  mimeType: string
  buffer: Buffer
}

export type ManagedProfileImageUploadResult = {
  assetId: string
  sourceKey: string
  publicKey: string
  url: string
}

export type ProfileImageOptimizationInput = {
  assetType: ProfileImageAssetType
  sourceKey: string
  publicKey: string
}

const PUBLIC_ALIAS_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=86400"

function resolveExtension(fileName: string, mimeType: string) {
  const fromName = extname(fileName).toLowerCase()
  if (fromName) {
    return fromName
  }

  if (mimeType === "image/jpeg") return ".jpg"
  if (mimeType === "image/png") return ".png"
  if (mimeType === "image/webp") return ".webp"
  return ""
}

function buildProfileImagePrefix(
  userId: string,
  assetType: ProfileImageAssetType,
  assetId: string
) {
  return `profile-images/${userId}/${assetType}/${assetId}`
}

function buildProfileImageKeys(input: {
  userId: string
  assetType: ProfileImageAssetType
  assetId: string
  fileName: string
  mimeType: string
}) {
  const prefix = buildProfileImagePrefix(input.userId, input.assetType, input.assetId)
  const sourceKey = `${prefix}/source${resolveExtension(input.fileName, input.mimeType)}`
  const publicKey = `${prefix}/public`

  return {
    prefix,
    sourceKey,
    publicKey,
  }
}

export async function uploadManagedProfileImage(
  config: R2MediaConfig,
  input: ManagedProfileImageUploadInput
): Promise<ManagedProfileImageUploadResult> {
  const assetId = randomUUID()
  const { sourceKey, publicKey } = buildProfileImageKeys({
    userId: input.userId,
    assetType: input.assetType,
    assetId,
    fileName: input.fileName,
    mimeType: input.mimeType,
  })

  await Promise.all([
    putMediaObject(config, {
      key: sourceKey,
      body: input.buffer,
      contentType: input.mimeType,
      cacheControl: "private, no-store",
    }),
    putMediaObject(config, {
      key: publicKey,
      body: input.buffer,
      contentType: input.mimeType,
      cacheControl: PUBLIC_ALIAS_CACHE_CONTROL,
    }),
  ])

  return {
    assetId,
    sourceKey,
    publicKey,
    url: getPublicMediaUrl(config, publicKey),
  }
}

export async function optimizeProfileImageToWebp(
  config: R2MediaConfig,
  input: ProfileImageOptimizationInput
) {
  const sourceBuffer = await readMediaObjectBuffer(config, input.sourceKey)
  const quality = input.assetType === "avatar" ? 82 : 80
  const output = await normalizeImageToWebp({
    buffer: sourceBuffer,
    quality,
  })

  await putMediaObject(config, {
    key: input.publicKey,
    body: output.buffer,
    contentType: output.mimeType,
    cacheControl: PUBLIC_ALIAS_CACHE_CONTROL,
  })

  await deleteMediaObject(config, input.sourceKey)
}

export function deriveManagedProfileImagePrefixFromUrl(
  config: R2MediaConfig,
  url: string | null | undefined
) {
  if (!url) {
    return null
  }

  const baseUrl = config.publicBaseUrl.replace(/\/$/, "")
  if (!url.startsWith(`${baseUrl}/`)) {
    return null
  }

  const key = url.slice(baseUrl.length + 1)
  const match = key.match(
    /^profile-images\/[^/]+\/(?:avatar|banner)\/[^/]+\/public$/
  )
  if (!match) {
    return null
  }

  return key.slice(0, -"/public".length)
}
