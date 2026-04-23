// NIP-57 Zap utilities for chapter paywall

export interface ZapConfig {
  amountSats: number
  recipientPubkey: string
  recipientLud16?: string // Lightning address e.g. author@getalby.com
  novelId: string
  chapterId: string
  chapterTitle: string
}

export interface ZapResult {
  success: boolean
  preimage?: string
  error?: string
}

const ZAP_RECEIPTS_KEY = "myth_story-zap-receipts"

// Check if a chapter has been unlocked (zap receipt stored locally)
export function isChapterUnlocked(novelId: string, chapterId: string): boolean {
  try {
    const receipts = localStorage.getItem(ZAP_RECEIPTS_KEY)
    if (!receipts) return false
    const parsed: string[] = JSON.parse(receipts)
    return parsed.includes(`${novelId}-${chapterId}`)
  } catch {
    return false
  }
}

// Store a zap receipt to mark chapter as unlocked
export function storeZapReceipt(novelId: string, chapterId: string): void {
  try {
    const receipts = localStorage.getItem(ZAP_RECEIPTS_KEY)
    const parsed: string[] = receipts ? JSON.parse(receipts) : []
    const key = `${novelId}-${chapterId}`
    if (!parsed.includes(key)) {
      parsed.push(key)
      localStorage.setItem(ZAP_RECEIPTS_KEY, JSON.stringify(parsed))
    }
  } catch {
    console.error("Failed to store zap receipt")
  }
}

// Fetch LNURL pay data from a Lightning address (lud16)
export async function fetchLnurlPayData(lud16: string): Promise<{
  callback: string
  minSendable: number
  maxSendable: number
  metadata: string
  allowsNostr?: boolean
  nostrPubkey?: string
} | null> {
  try {
    const [name, domain] = lud16.split("@")
    const url = `https://${domain}/.well-known/lnurlp/${name}`
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Request a Lightning invoice from LNURL callback
export async function requestInvoice(
  callbackUrl: string,
  amountMsats: number,
  zapRequest?: string
): Promise<{ pr: string } | null> {
  try {
    const params = new URLSearchParams({ amount: String(amountMsats) })
    if (zapRequest) params.set("nostr", zapRequest)
    const res = await fetch(`${callbackUrl}?${params}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.pr) return { pr: data.pr }
    return null
  } catch {
    return null
  }
}

// Build a NIP-57 zap request event (kind 9734)
export async function buildZapRequest(config: ZapConfig): Promise<string | null> {
  if (typeof window === "undefined" || !window.nostr) return null
  try {
    const pubkey = await window.nostr.getPublicKey()
    const event = {
      kind: 9734,
      created_at: Math.floor(Date.now() / 1000),
      content: `Unlocking Chapter: ${config.chapterTitle}`,
      tags: [
        ["p", config.recipientPubkey],
        ["amount", String(config.amountSats * 1000)],
        ["relays", "wss://relay.damus.io", "wss://nos.lol"],
        ["a", `30023:${config.recipientPubkey}:${config.novelId}`],
      ],
      pubkey,
    }
    const signed = await window.nostr.signEvent(event as Parameters<typeof window.nostr.signEvent>[0])
    return JSON.stringify(signed)
  } catch {
    return null
  }
}

// Open a WebLN payment (NIP-07 wallet like Alby)
export async function payWithWebLN(invoice: string): Promise<ZapResult> {
  const webln = (window as Window & { webln?: { enable(): Promise<void>; sendPayment(invoice: string): Promise<{ preimage: string }> } }).webln
  if (!webln) {
    return { success: false, error: "No WebLN provider found. Install Alby or a compatible wallet." }
  }
  try {
    await webln.enable()
    const result = await webln.sendPayment(invoice)
    return { success: true, preimage: result.preimage }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment failed"
    return { success: false, error: message }
  }
}
