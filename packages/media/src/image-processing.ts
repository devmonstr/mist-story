import sharp from "sharp"

export type ImageResizeFit = "cover" | "contain" | "fill" | "inside" | "outside"

export type NormalizeImageToWebpInput = {
  buffer: Buffer
  width?: number
  height?: number
  fit?: ImageResizeFit
  withoutEnlargement?: boolean
  background?: string
  quality?: number
  qualities?: readonly number[]
  maxSizeBytes?: number
}

export type NormalizeImageToWebpResult = {
  buffer: Buffer
  mimeType: "image/webp"
  fileSizeBytes: number
  quality: number
}

export class MediaImageProcessingError extends Error {
  override name = "MediaImageProcessingError"
  override cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.cause = cause
  }
}

export class MediaImageTooLargeError extends Error {
  override name = "MediaImageTooLargeError"
}

async function renderWebp(
  input: NormalizeImageToWebpInput,
  quality: number
): Promise<NormalizeImageToWebpResult> {
  try {
    let pipeline = sharp(input.buffer).rotate()

    if (input.width || input.height) {
      pipeline = pipeline.resize({
        width: input.width,
        height: input.height,
        fit: input.fit ?? "cover",
        withoutEnlargement: input.withoutEnlargement,
        background: input.background,
      })
    }

    const output = await pipeline.webp({ quality }).toBuffer()
    return {
      buffer: output,
      mimeType: "image/webp",
      fileSizeBytes: output.byteLength,
      quality,
    }
  } catch (error) {
    throw new MediaImageProcessingError("Image could not be processed", error)
  }
}

export async function normalizeImageToWebp(
  input: NormalizeImageToWebpInput
): Promise<NormalizeImageToWebpResult> {
  const qualities = input.qualities ?? [input.quality ?? 82]
  let lastResult: NormalizeImageToWebpResult | null = null

  for (const quality of qualities) {
    const result = await renderWebp(input, quality)
    lastResult = result

    if (!input.maxSizeBytes || result.fileSizeBytes <= input.maxSizeBytes) {
      return result
    }
  }

  if (lastResult) {
    throw new MediaImageTooLargeError("Optimized image is too large")
  }

  throw new MediaImageProcessingError("Image could not be processed", null)
}
