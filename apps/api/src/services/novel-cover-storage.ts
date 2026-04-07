import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import type { CreateNovelInput, UpdateNovelInput } from "@mist/shared"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const MAX_COVER_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

let r2Client: S3Client | null = null

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function isMissingR2ObjectError(error: unknown) {
  const record = asRecord(error)
  if (!record) {
    return false
  }

  const code = record.Code
  if (code === "NoSuchKey" || code === "NotFound") {
    return true
  }

  const name = record.name
  if (name === "NoSuchKey" || name === "NotFound") {
    return true
  }

  const metadata = asRecord(record.$metadata)
  return metadata?.httpStatusCode === 404
}

function getR2Client() {
  if (r2Client) {
    return r2Client
  }

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

function getBucketName() {
  const publicBaseUrl = env.R2_ENDPOINT ?? env.R2_PUBLIC_BASE_URL

  if (!env.R2_BUCKET_NAME || !publicBaseUrl) {
    throw new HttpError(500, "Cloudflare R2 is not configured for cover uploads")
  }

  return {
    bucketName: env.R2_BUCKET_NAME,
    publicBaseUrl: publicBaseUrl.replace(/\/$/, ""),
  }
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

export async function uploadNovelCoverAsset(input: {
  userId: string
  novelId?: string
  payload: CreateNovelInput | UpdateNovelInput
}) {
  const upload = normalizeUpload(input.payload)
  if (!upload) {
    return null
  }

  const { bucketName, publicBaseUrl } = getBucketName()
  const client = getR2Client()
  const key = `novel-covers/${input.userId}/${input.novelId ?? "draft"}/${randomUUID()}${resolveExtension(
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
    coverUrl: `${publicBaseUrl}/${key}`,
    coverStorageKey: key,
    coverMimeType: upload.mimeType,
    coverOriginalName: upload.fileName,
    coverFileSizeBytes: upload.fileSizeBytes,
  }
}

export async function deleteNovelCoverAsset(coverStorageKey: string | null | undefined) {
  if (!coverStorageKey) {
    return
  }

  try {
    const { bucketName } = getBucketName()
    const client = getR2Client()
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: coverStorageKey,
      })
    )
  } catch (error) {
    console.error("[novel-cover] failed to delete old cover asset", error)
  }
}

export async function getNovelCoverAsset(coverStorageKey: string) {
  const { bucketName } = getBucketName()
  const client = getR2Client()

  try {
    return await client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: coverStorageKey,
      })
    )
  } catch (error) {
    if (isMissingR2ObjectError(error)) {
      return null
    }

    throw error
  }
}
