import { markUserProfileFetchAttempt, saveUserNostrProfileSnapshot, upsertUserByPubkey } from "@mist/db"
import type { ProfileSyncJobPayload } from "@mist/shared"
import { fetchLatestNostrProfile } from "@mist/shared/nostr-profile"

export async function processProfileSyncJob(payload: ProfileSyncJobPayload) {
  await upsertUserByPubkey(payload.pubkey)

  const snapshot = await fetchLatestNostrProfile(payload.pubkey)
  if (!snapshot) {
    await markUserProfileFetchAttempt(payload.pubkey)
    return
  }

  await saveUserNostrProfileSnapshot({
    pubkey: payload.pubkey,
    ...snapshot,
  })
}
