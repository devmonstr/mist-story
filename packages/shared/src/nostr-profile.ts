import { SimplePool, useWebSocketImplementation } from "nostr-tools/pool"
import WebSocket from "ws"

useWebSocketImplementation(WebSocket)

const pool = new SimplePool({
  enablePing: true,
  enableReconnect: true,
})

export const DEFAULT_NOSTR_PROFILE_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
]

export interface NostrProfileSnapshot {
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  nip05: string | null
  lud16: string | null
  website: string | null
  profileEventId: string
  profileEventCreatedAt: Date
  profileFetchedAt: Date
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function toNullableUrl(value: unknown) {
  const normalized = toNullableString(value)
  if (!normalized) {
    return null
  }

  try {
    return new URL(normalized).toString()
  } catch {
    return null
  }
}

export async function fetchLatestNostrProfile(
  pubkey: string,
  relays = DEFAULT_NOSTR_PROFILE_RELAYS
): Promise<NostrProfileSnapshot | null> {
  const event = await pool.get(
    relays,
    {
      authors: [pubkey],
      kinds: [0],
    },
    {
      maxWait: 4_000,
    }
  )

  if (!event) {
    return null
  }

  let content: Record<string, unknown> = {}
  try {
    content = JSON.parse(event.content) as Record<string, unknown>
  } catch {
    content = {}
  }

  const handle = toNullableString(content.name)

  return {
    handle,
    displayName: toNullableString(content.display_name) ?? handle,
    about: toNullableString(content.about),
    avatarUrl: toNullableUrl(content.picture),
    bannerUrl: toNullableUrl(content.banner),
    nip05: toNullableString(content.nip05),
    lud16: toNullableString(content.lud16),
    website: toNullableUrl(content.website),
    profileEventId: event.id,
    profileEventCreatedAt: new Date(event.created_at * 1000),
    profileFetchedAt: new Date(),
  }
}
