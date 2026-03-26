import { randomUUID } from "node:crypto"
import { extname } from "node:path"
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import type { ProfileImageAssetType } from "@mist/shared"
import sharp from "sharp"

export type R2MediaConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicBaseUrl: string
}

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

const clients = new Map<string, S3Client>()

function getClientCacheKey(config: R2MediaConfig) {
  return [
    config.accountId,
    config.accessKeyId,
    config.bucketName,
    config.publicBaseUrl,
  ].join(":")
}

function getR2Client(config: R2MediaConfig) {
  const cacheKey = getClientCacheKey(config)
  const existing = clients.get(cacheKey)
  if (existing) {
    return existing
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  clients.set(cacheKey, client)
  return client
}

function normalizeBaseUrl(publicBaseUrl: string) {
  return publicBaseUrl.replace(/\/$/, "")
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

async function readObjectBuffer(config: R2MediaConfig, key: string) {
  const client = getR2Client(config)
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  )

  if (!response.Body) {
    throw new Error(`Object body is empty for key "${key}"`)
  }

  const bytes = await response.Body.transformToByteArray()
  return Buffer.from(bytes)
}

export function createR2MediaConfig(input: {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicBaseUrl: string
}): R2MediaConfig {
  return {
    accountId: input.accountId,
    accessKeyId: input.accessKeyId,
    secretAccessKey: input.secretAccessKey,
    bucketName: input.bucketName,
    publicBaseUrl: normalizeBaseUrl(input.publicBaseUrl),
  }
}

export async function uploadManagedProfileImage(
  config: R2MediaConfig,
  input: ManagedProfileImageUploadInput
): Promise<ManagedProfileImageUploadResult> {
  const assetId = randomUUID()
  const client = getR2Client(config)
  const { sourceKey, publicKey } = buildProfileImageKeys({
    userId: input.userId,
    assetType: input.assetType,
    assetId,
    fileName: input.fileName,
    mimeType: input.mimeType,
  })

  await Promise.all([
    client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: sourceKey,
        Body: input.buffer,
        ContentType: input.mimeType,
        CacheControl: "private, no-store",
      })
    ),
    client.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: publicKey,
        Body: input.buffer,
        ContentType: input.mimeType,
        CacheControl: PUBLIC_ALIAS_CACHE_CONTROL,
      })
    ),
  ])

  return {
    assetId,
    sourceKey,
    publicKey,
    url: `${config.publicBaseUrl}/${publicKey}`,
  }
}

export async function optimizeProfileImageToWebp(
  config: R2MediaConfig,
  input: ProfileImageOptimizationInput
) {
  const sourceBuffer = await readObjectBuffer(config, input.sourceKey)
  const quality = input.assetType === "avatar" ? 82 : 80
  const outputBuffer = await sharp(sourceBuffer)
    .rotate()
    .webp({
      quality,
    })
    .toBuffer()

  const client = getR2Client(config)
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.publicKey,
      Body: outputBuffer,
      ContentType: "image/webp",
      CacheControl: PUBLIC_ALIAS_CACHE_CONTROL,
    })
  )

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: input.sourceKey,
    })
  )
}

export function deriveManagedProfileImagePrefixFromUrl(
  config: R2MediaConfig,
  url: string | null | undefined
) {
  if (!url) {
    return null
  }

  const baseUrl = normalizeBaseUrl(config.publicBaseUrl)
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

export async function deleteObjectsByPrefix(
  config: R2MediaConfig,
  prefix: string
) {
  const client = getR2Client(config)
  let continuationToken: string | undefined

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
        ContinuationToken: continuationToken,
      })
    )

    const objects =
      listed.Contents?.flatMap((item) =>
        item.Key
          ? [
              {
                Key: item.Key,
              },
            ]
          : []
      ) ?? []

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: config.bucketName,
          Delete: {
            Objects: objects,
            Quiet: true,
          },
        })
      )
    }

    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined
  } while (continuationToken)
}
