import { createR2MediaConfig, optimizeProfileImageToWebp } from "@mist/media"
import type { ProfileImageOptimizeJobPayload } from "@mist/shared"
import { env } from "../config/env"

function getProfileImageMediaConfig() {
  const publicBaseUrl = env.R2_ENDPOINT ?? env.R2_PUBLIC_BASE_URL

  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !publicBaseUrl
  ) {
    throw new Error("Cloudflare R2 is not configured for profile image optimization")
  }

  return createR2MediaConfig({
    accountId: env.R2_ACCOUNT_ID,
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    bucketName: env.R2_BUCKET_NAME,
    publicBaseUrl,
  })
}

export async function processProfileImageOptimizeJob(
  payload: ProfileImageOptimizeJobPayload
) {
  const config = getProfileImageMediaConfig()
  await optimizeProfileImageToWebp(config, {
    assetType: payload.assetType,
    sourceKey: payload.sourceKey,
    publicKey: payload.publicKey,
  })
}
