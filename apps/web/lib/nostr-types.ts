// Nostr NIP-07 Types
export interface NostrEvent {
  id?: string
  pubkey?: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig?: string
}

export interface NostrUser {
  pubkey: string
  npub: string
  profile?: NostrProfile
}

export interface NostrProfile {
  name?: string
  display_name?: string
  picture?: string
  banner?: string
  about?: string
  website?: string
  nip05?: string
  lud16?: string
}

export interface NostrRelayPolicy {
  read: boolean
  write: boolean
}

export interface Nip07Nostr {
  getPublicKey(): Promise<string>
  signEvent(event: NostrEvent): Promise<NostrEvent>
  getRelays?(): Promise<Record<string, NostrRelayPolicy>>
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
  }
}

declare global {
  interface Window {
    nostr?: Nip07Nostr
  }
}
