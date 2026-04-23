import { markUserProfileFetchAttempt, saveUserNostrProfileSnapshot, upsertUserByPubkey } from "@myth/db"
import type { ProfileSyncJobPayload } from "@myth/shared"
import { fetchLatestNostrProfile } from "@myth/shared/nostr-profile"

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
