import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import type { ProfileImageAssetType, UploadProfileImageInput } from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const MAX_PROFILE_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

let r2Client: S3Client | null = null

function getR2Client() {
  if (r2Client) {
    return r2Client
  }

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !env.R2_PUBLIC_BASE_URL
  ) {
    throw new HttpError(500, "Cloudflare R2 is not configured for profile image uploads")
  }

  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })

  return r2Client
}

function getBucketConfig() {
  if (!env.R2_BUCKET_NAME || !env.R2_PUBLIC_BASE_URL) {
    throw new HttpError(500, "Cloudflare R2 is not configured for profile image uploads")
  }

  return {
    bucketName: env.R2_BUCKET_NAME,
    publicBaseUrl: env.R2_PUBLIC_BASE_URL.replace(/\/$/, ""),
  }
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

function deriveManagedR2Key(url: string | null | undefined) {
  if (!url) {
    return null
  }

  const { publicBaseUrl } = getBucketConfig()
  if (!url.startsWith(`${publicBaseUrl}/`)) {
    return null
  }

  return url.slice(publicBaseUrl.length + 1)
}

export async function uploadProfileImageAsset(input: {
  userId: string
  assetType: ProfileImageAssetType
  payload: UploadProfileImageInput["image"]
}) {
  const upload = normalizeUpload(input.payload)
  const { bucketName, publicBaseUrl } = getBucketConfig()
  const client = getR2Client()
  const key = `profile-images/${input.userId}/${input.assetType}/${randomUUID()}${resolveExtension(
    upload.fileName,
    upload.mimeType
  )}`

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: upload.buffer,
      ContentType: upload.mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )

  return {
    url: `${publicBaseUrl}/${key}`,
  }
}

export async function deleteManagedProfileImageAsset(url: string | null | undefined) {
  const key = deriveManagedR2Key(url)
  if (!key) {
    return
  }

  try {
    const { bucketName } = getBucketConfig()
    const client = getR2Client()
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    )
  } catch (error) {
    console.error("[profile-image] failed to delete old profile image asset", error)
  }
}
