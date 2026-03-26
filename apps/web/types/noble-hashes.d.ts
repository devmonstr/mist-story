declare module "@noble/hashes/hmac.js" {
  export function hmac(
    hash: ((message: Uint8Array) => Uint8Array) & { outputLen?: number; blockLen?: number },
    key: Uint8Array,
    message: Uint8Array
  ): Uint8Array
}

declare module "@noble/hashes/sha2.js" {
  export const sha256: ((message: Uint8Array) => Uint8Array) & {
    outputLen: number
    blockLen: number
  }
}
