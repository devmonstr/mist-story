import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

export type R2MediaConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicBaseUrl: string
}

export type MediaOperationOptions = {
  abortSignal?: AbortSignal
}

export type PutMediaObjectInput = {
  key: string
  body: Buffer | Uint8Array
  contentType: string
  cacheControl: string
}

const clients = new Map<string, S3Client>()

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null
}

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

export function isMissingR2ObjectError(error: unknown) {
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

export function getPublicMediaUrl(config: R2MediaConfig, key: string) {
  return `${config.publicBaseUrl}/${key}`
}

export async function putMediaObject(
  config: R2MediaConfig,
  input: PutMediaObjectInput,
  options?: MediaOperationOptions
) {
  const client = getR2Client(config)
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
    options
  )
}

export async function getMediaObject(
  config: R2MediaConfig,
  key: string,
  options?: MediaOperationOptions
) {
  const client = getR2Client(config)
  return client.send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
    options
  )
}

export async function getMediaObjectOrNull(
  config: R2MediaConfig,
  key: string,
  options?: MediaOperationOptions
) {
  try {
    return await getMediaObject(config, key, options)
  } catch (error) {
    if (isMissingR2ObjectError(error)) {
      return null
    }

    throw error
  }
}

export async function readMediaObjectBuffer(config: R2MediaConfig, key: string) {
  const response = await getMediaObject(config, key)

  if (!response.Body) {
    throw new Error(`Object body is empty for key "${key}"`)
  }

  const bytes = await response.Body.transformToByteArray()
  return Buffer.from(bytes)
}

export async function deleteMediaObject(config: R2MediaConfig, key: string) {
  const client = getR2Client(config)
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  )
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
