import type { NostrEvent, NostrProfile, NostrUser } from "./nostr-types"
import { hashes, schnorr } from "@noble/secp256k1"
import { hmac } from "@noble/hashes/hmac.js"
import { sha256 } from "@noble/hashes/sha2.js"

type SignedAuthEvent = NostrEvent & {
  pubkey: string
  id: string
  sig: string
}

export type PublishedNostrEvent = NostrEvent & {
  pubkey: string
  id: string
  sig: string
}

export type RelayPublishResult = {
  relayUrl: string
  success: boolean
  message: string | null
}

export const DEFAULT_NOSTR_PROFILE_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.nostr.band",
  "wss://relay.primal.net",
]

hashes.hmacSha256 = (key, message) => hmac(sha256, key, message)
hashes.sha256 = sha256
hashes.hmacSha256Async = async (key, message) => hmac(sha256, key, message)
hashes.sha256Async = async (message) => sha256(message)

// Bech32 character set
const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

// Convert hex to bech32 (npub)
export function hexToNpub(hex: string): string {
  const data = hexToBytes(hex)
  return bech32Encode("npub", data)
}

// Convert npub to hex
export function npubToHex(npub: string): string | null {
  try {
    const decoded = bech32Decode(npub)
    if (decoded.prefix !== "npub") return null
    return bytesToHex(decoded.data)
  } catch {
    return null
  }
}

// Convert nsec to hex (private key)
export function nsecToHex(nsec: string): string | null {
  try {
    const decoded = bech32Decode(nsec)
    if (decoded.prefix !== "nsec") return null
    return bytesToHex(decoded.data)
  } catch {
    return null
  }
}

// Derive public key from private key
export function getPublicKeyFromPrivateKey(privateKeyHex: string): string | null {
  try {
    // Convert hex string to Uint8Array (required by @noble/secp256k1 v3)
    const privateKeyBytes = hexToBytes(privateKeyHex)
    // schnorr.getPublicKey returns 32-byte x-only public key directly
    const pubkeyBytes = schnorr.getPublicKey(privateKeyBytes)
    return bytesToHex(pubkeyBytes)
  } catch (error) {
    console.error("Error deriving public key:", error)
    return null
  }
}

// Validate nsec format
export function isValidNsec(nsec: string): boolean {
  if (!nsec.startsWith("nsec1")) return false
  const hex = nsecToHex(nsec)
  return hex !== null && hex.length === 64
}

export function getPublicKeyFromNsec(nsec: string): string | null {
  const privateKeyHex = nsecToHex(nsec)
  if (!privateKeyHex) {
    return null
  }

  return getPublicKeyFromPrivateKey(privateKeyHex)
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function bech32Encode(prefix: string, data: Uint8Array): string {
  const words = convertBits(data, 8, 5, true)
  const checksum = bech32Checksum(prefix, words)
  const combined = [...words, ...checksum]
  return prefix + "1" + combined.map((w) => BECH32_CHARSET[w]).join("")
}

function bech32Decode(str: string): { prefix: string; data: Uint8Array } {
  const pos = str.lastIndexOf("1")
  const prefix = str.slice(0, pos)
  const dataStr = str.slice(pos + 1)
  const words = dataStr.split("").map((c) => BECH32_CHARSET.indexOf(c))
  const data = convertBits(new Uint8Array(words.slice(0, -6)), 5, 8, false)
  return { prefix, data: new Uint8Array(data) }
}

function convertBits(
  data: Uint8Array,
  fromBits: number,
  toBits: number,
  pad: boolean
): number[] {
  let acc = 0
  let bits = 0
  const result: number[] = []
  const maxv = (1 << toBits) - 1

  for (const value of data) {
    acc = (acc << fromBits) | value
    bits += fromBits
    while (bits >= toBits) {
      bits -= toBits
      result.push((acc >> bits) & maxv)
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv)
    }
  }

  return result
}

function bech32Checksum(prefix: string, words: number[]): number[] {
  const values = [
    ...prefix.split("").map((c) => c.charCodeAt(0) >> 5),
    0,
    ...prefix.split("").map((c) => c.charCodeAt(0) & 31),
    ...words,
  ]
  const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1
  const result: number[] = []
  for (let i = 0; i < 6; i++) {
    result.push((polymod >> (5 * (5 - i))) & 31)
  }
  return result
}

function bech32Polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const v of values) {
    const b = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ v
    for (let i = 0; i < 5; i++) {
      if ((b >> i) & 1) {
        chk ^= GEN[i]
      }
    }
  }
  return chk
}

// Check if NIP-07 extension is available
export function isNostrExtensionAvailable(): boolean {
  return typeof window !== "undefined" && !!window.nostr
}

// Get public key from extension
export async function getPublicKey(): Promise<string | null> {
  if (!isNostrExtensionAvailable()) return null
  try {
    return await window.nostr!.getPublicKey()
  } catch {
    return null
  }
}

// Sign an event using NIP-07
export async function signEvent(event: NostrEvent): Promise<NostrEvent | null> {
  if (!isNostrExtensionAvailable()) return null
  try {
    return await window.nostr!.signEvent(event)
  } catch {
    return null
  }
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes)
    return bytesToHex(new Uint8Array(digest))
  }

  return bytesToHex(sha256(bytes))
}

function serializeEvent(event: NostrEvent & { pubkey: string }) {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ])
}

async function buildSignedEvent(
  event: NostrEvent & { pubkey: string },
  privateKeyHex: string
): Promise<SignedAuthEvent> {
  const id = await sha256Hex(serializeEvent(event))
  const sigBytes = schnorr.sign(hexToBytes(id), hexToBytes(privateKeyHex))

  return {
    ...event,
    id,
    sig: bytesToHex(sigBytes),
  }
}

export function createAuthEvent(pubkey: string, challenge: string): NostrEvent & {
  pubkey: string
} {
  return {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 27235,
    tags: [["t", "myth-auth"]],
    content: challenge,
  }
}

export async function signAuthChallengeWithExtension(
  pubkey: string,
  challenge: string
): Promise<SignedAuthEvent | null> {
  const signedEvent = await signEvent(createAuthEvent(pubkey, challenge))
  if (!signedEvent?.pubkey || !signedEvent.id || !signedEvent.sig) {
    return null
  }

  return signedEvent as SignedAuthEvent
}

export async function signAuthChallengeWithNsec(
  nsec: string,
  challenge: string
): Promise<SignedAuthEvent | null> {
  const privateKeyHex = nsecToHex(nsec)
  if (!privateKeyHex) return null

  const pubkey = getPublicKeyFromPrivateKey(privateKeyHex)
  if (!pubkey) return null

  return buildSignedEvent(createAuthEvent(pubkey, challenge), privateKeyHex)
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeOptionalUrl(value: unknown) {
  const normalized = normalizeOptionalString(value)
  if (!normalized) {
    return null
  }

  try {
    return new URL(normalized).toString()
  } catch {
    throw new Error(`Invalid URL: ${normalized}`)
  }
}

export function buildProfileMetadataContent(
  profile: Partial<NostrProfile>,
  extraMetadata: Record<string, unknown> = {}
) {
  const metadata: Record<string, unknown> = { ...extraMetadata }

  for (const key of [
    "name",
    "display_name",
    "about",
    "picture",
    "banner",
    "website",
    "nip05",
    "lud16",
  ]) {
    delete metadata[key]
  }

  const name = normalizeOptionalString(profile.name)
  const displayName = normalizeOptionalString(profile.display_name)
  if (displayName && !name) {
    throw new Error("`name` is required when `display_name` is set")
  }

  const about = normalizeOptionalString(profile.about)
  const picture = normalizeOptionalUrl(profile.picture)
  const banner = normalizeOptionalUrl(profile.banner)
  const website = normalizeOptionalUrl(profile.website)
  const nip05 = normalizeOptionalString(profile.nip05)
  const lud16 = normalizeOptionalString(profile.lud16)

  if (name) metadata.name = name
  if (displayName) metadata.display_name = displayName
  if (about) metadata.about = about
  if (picture) metadata.picture = picture
  if (banner) metadata.banner = banner
  if (website) metadata.website = website
  if (nip05) metadata.nip05 = nip05
  if (lud16) metadata.lud16 = lud16

  return metadata
}

export async function signKind0MetadataEvent(
  metadata: Record<string, unknown>
): Promise<PublishedNostrEvent | null> {
  const signed = await signEvent({
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify(metadata),
  })

  if (!signed?.id || !signed.pubkey || !signed.sig) {
    return null
  }

  return signed as PublishedNostrEvent
}

export async function signKind0MetadataEventWithNsec(
  nsec: string,
  metadata: Record<string, unknown>
): Promise<PublishedNostrEvent | null> {
  const privateKeyHex = nsecToHex(nsec)
  if (!privateKeyHex) return null

  const pubkey = getPublicKeyFromPrivateKey(privateKeyHex)
  if (!pubkey) return null

  const event: NostrEvent & { pubkey: string } = {
    pubkey,
    created_at: Math.floor(Date.now() / 1000),
    kind: 0,
    tags: [],
    content: JSON.stringify(metadata),
  }

  const signed = await buildSignedEvent(event, privateKeyHex)
  return signed as PublishedNostrEvent
}

// Fetch profile from relay (uses multiple relays for reliability)
export async function fetchProfile(pubkey: string): Promise<NostrProfile | null> {
  const relays = DEFAULT_NOSTR_PROFILE_RELAYS

  // Try each relay
  for (const relayUrl of relays) {
    try {
      const profile = await fetchProfileFromRelay(relayUrl, pubkey)
      if (profile) {
        console.log(`[Nostr] Profile fetched from ${relayUrl}`)
        return profile
      }
    } catch (error) {
      console.warn(`[Nostr] Failed to fetch from ${relayUrl}:`, error)
    }
  }

  console.log("[Nostr] Profile not found on any relay")
  return null
}

export async function fetchLatestProfileMetadata(
  pubkey: string,
  relays = DEFAULT_NOSTR_PROFILE_RELAYS
): Promise<Record<string, unknown> | null> {
  for (const relayUrl of dedupeRelayUrls(relays)) {
    try {
      const metadata = await fetchProfileMetadataFromRelay(relayUrl, pubkey)
      if (metadata) {
        return metadata
      }
    } catch (error) {
      console.warn(`[Nostr] Failed to fetch raw metadata from ${relayUrl}:`, error)
    }
  }

  return null
}

function fetchProfileFromRelay(relayUrl: string, pubkey: string): Promise<NostrProfile | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relayUrl)
    const timeout = setTimeout(() => {
      ws.close()
      resolve(null)
    }, 8000)

    ws.onopen = () => {
      const subscriptionId = Math.random().toString(36).slice(2)
      const filter = {
        kinds: [0], // Kind 0 is profile metadata
        authors: [pubkey],
        limit: 1,
      }
      ws.send(JSON.stringify(["REQ", subscriptionId, filter]))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data[0] === "EVENT") {
          const content = JSON.parse(data[2].content) as NostrProfile
          clearTimeout(timeout)
          ws.close()
          resolve(content)
        } else if (data[0] === "EOSE") {
          clearTimeout(timeout)
          ws.close()
          resolve(null)
        }
      } catch {
        // Continue waiting
      }
    }

    ws.onerror = () => {
      clearTimeout(timeout)
      ws.close()
      resolve(null)
    }
  })
}

function fetchProfileMetadataFromRelay(
  relayUrl: string,
  pubkey: string
): Promise<Record<string, unknown> | null> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relayUrl)
    let settled = false
    const finish = (value: Record<string, unknown> | null) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      try {
        ws.close()
      } catch {
        // ignore close failures
      }
      resolve(value)
    }

    const timeout = setTimeout(() => {
      finish(null)
    }, 8000)

    ws.onopen = () => {
      const subscriptionId = Math.random().toString(36).slice(2)
      ws.send(
        JSON.stringify([
          "REQ",
          subscriptionId,
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1,
          },
        ])
      )
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data[0] === "EVENT") {
          const parsed = JSON.parse(data[2].content) as unknown
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            finish(parsed as Record<string, unknown>)
          }
        } else if (data[0] === "EOSE") {
          finish(null)
        }
      } catch {
        // Continue waiting
      }
    }

    ws.onerror = () => {
      finish(null)
    }
  })
}

function dedupeRelayUrls(relays: string[]) {
  const seen = new Set<string>()
  return relays
    .map((relayUrl) => relayUrl.trim())
    .filter((relayUrl) => relayUrl.length > 0)
    .filter((relayUrl) => {
      if (seen.has(relayUrl)) {
        return false
      }

      seen.add(relayUrl)
      return true
    })
}

function publishEventToRelay(
  relayUrl: string,
  event: PublishedNostrEvent
): Promise<RelayPublishResult> {
  return new Promise((resolve) => {
    const ws = new WebSocket(relayUrl)
    let settled = false

    const finish = (success: boolean, message: string | null) => {
      if (settled) {
        return
      }

      settled = true
      clearTimeout(timeout)
      try {
        ws.close()
      } catch {
        // ignore close failures
      }
      resolve({
        relayUrl,
        success,
        message,
      })
    }

    const timeout = setTimeout(() => {
      finish(false, "Relay timed out before acknowledging the event")
    }, 10000)

    ws.onopen = () => {
      ws.send(JSON.stringify(["EVENT", event]))
    }

    ws.onmessage = (messageEvent) => {
      try {
        const data = JSON.parse(messageEvent.data)
        if (Array.isArray(data) && data[0] === "OK" && data[1] === event.id) {
          finish(Boolean(data[2]), typeof data[3] === "string" ? data[3] : null)
        }
      } catch {
        // Ignore malformed relay messages while waiting for OK
      }
    }

    ws.onerror = () => {
      finish(false, "Failed to connect to relay")
    }

    ws.onclose = () => {
      if (!settled) {
        finish(false, "Relay closed before acknowledging the event")
      }
    }
  })
}

export async function publishEventToRelays(
  event: PublishedNostrEvent,
  relayUrls: string[]
) {
  const relays = dedupeRelayUrls(relayUrls)
  if (relays.length === 0) {
    return [] as RelayPublishResult[]
  }

  return Promise.all(relays.map((relayUrl) => publishEventToRelay(relayUrl, event)))
}

// Create a NostrUser object
export async function createNostrUser(pubkey: string): Promise<NostrUser> {
  const npub = hexToNpub(pubkey)
  const profile = await fetchProfile(pubkey)
  
  return {
    pubkey,
    npub,
    profile: profile || undefined,
  }
}

// Truncate npub for display
export function truncateNpub(npub: string, length: number = 8): string {
  if (npub.length <= length * 2 + 3) return npub
  return `${npub.slice(0, length + 4)}...${npub.slice(-length)}`
}
