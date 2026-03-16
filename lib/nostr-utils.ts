import type { NostrEvent, NostrProfile, NostrUser } from "./nostr-types"
import { schnorr } from "@noble/secp256k1"

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

// Fetch profile from relay (simplified - uses a public relay)
export async function fetchProfile(pubkey: string): Promise<NostrProfile | null> {
  try {
    // Using a public relay to fetch profile metadata
    const relayUrl = "wss://relay.damus.io"
    
    return new Promise((resolve) => {
      const ws = new WebSocket(relayUrl)
      const timeout = setTimeout(() => {
        ws.close()
        resolve(null)
      }, 5000)

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
  } catch {
    return null
  }
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
