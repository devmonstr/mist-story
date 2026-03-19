import { createHash, randomBytes } from "node:crypto"
import type {
  Chapter,
  ChapterVersion,
  Novel,
  Prisma,
  User,
} from "@prisma/client"
import type {
  AuthUserDto,
  ChapterDto,
  ChapterVersionDto,
  NovelDto,
} from "@mist/shared"

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "novel"
}

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

function hexToBytes(hex: string) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function convertBits(
  data: Uint8Array,
  fromBits: number,
  toBits: number,
  pad: boolean
) {
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

  if (pad && bits > 0) {
    result.push((acc << (toBits - bits)) & maxv)
  }

  return result
}

function bech32Polymod(values: number[]) {
  const gen = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3]
  let chk = 1
  for (const value of values) {
    const top = chk >> 25
    chk = ((chk & 0x1ffffff) << 5) ^ value
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= gen[i]
    }
  }
  return chk
}

function bech32Checksum(prefix: string, words: number[]) {
  const values = [
    ...prefix.split("").map((char) => char.charCodeAt(0) >> 5),
    0,
    ...prefix.split("").map((char) => char.charCodeAt(0) & 31),
    ...words,
  ]
  const polymod = bech32Polymod([...values, 0, 0, 0, 0, 0, 0]) ^ 1
  return Array.from({ length: 6 }, (_, index) => (polymod >> (5 * (5 - index))) & 31)
}

export function hexToNpub(hex: string) {
  const words = convertBits(hexToBytes(hex), 8, 5, true)
  const checksum = bech32Checksum("npub", words)
  return `npub1${[...words, ...checksum].map((word) => BECH32_CHARSET[word]).join("")}`
}

export function npubToHex(npub: string) {
  try {
    const separatorIndex = npub.lastIndexOf("1")
    if (separatorIndex < 1) {
      return null
    }

    const prefix = npub.slice(0, separatorIndex)
    if (prefix !== "npub") {
      return null
    }

    const dataPart = npub.slice(separatorIndex + 1)
    const words = dataPart
      .slice(0, -6)
      .split("")
      .map((character) => BECH32_CHARSET.indexOf(character))

    if (words.some((word) => word < 0)) {
      return null
    }

    const bytes = convertBits(new Uint8Array(words), 5, 8, false)
    return bytesToHex(new Uint8Array(bytes))
  } catch {
    return null
  }
}

export function toIsoString(value: Date | null) {
  return value ? value.toISOString() : null
}

export function decimalToNumber(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : value.toNumber()
}

export function buildChapterContentHash(content: string) {
  return createHash("sha256").update(content).digest("hex")
}

export function randomToken(size = 16) {
  return randomBytes(size).toString("hex")
}

export function serializeUser(user: User): AuthUserDto {
  return {
    id: user.id,
    pubkey: user.pubkey,
    npub: hexToNpub(user.pubkey),
    profile: {
      name: user.handle ?? null,
      display_name: user.displayName ?? null,
      picture: user.avatarUrl ?? null,
      banner: user.bannerUrl ?? null,
      about: user.about ?? null,
      nip05: user.nip05 ?? null,
      lud16: user.lud16 ?? null,
      website: user.website ?? null,
    },
  }
}

export function serializeNovel(novel: Novel): NovelDto {
  return {
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    summary: novel.summary,
    genre: novel.genre,
    subgenres: novel.subgenres,
    tags: novel.tags,
    authorId: novel.authorId,
    authorDisplayName: novel.authorDisplayName,
    translatorName: novel.translatorName,
    status: novel.status,
    visibility: novel.visibility,
    rating: decimalToNumber(novel.rating),
    ratingsCount: novel.ratingsCount,
    updateNote: novel.updateNote,
    coverUrl: novel.coverUrl,
    chaptersCount: novel.chaptersCount,
    publishedAt: toIsoString(novel.publishedAt),
    archivedAt: toIsoString(novel.archivedAt),
    createdAt: novel.createdAt.toISOString(),
    updatedAt: novel.updatedAt.toISOString(),
  }
}

export function serializeChapter(chapter: Chapter): ChapterDto {
  return {
    id: chapter.id,
    novelId: chapter.novelId,
    number: chapter.number,
    title: chapter.title,
    note: chapter.note,
    contentDraft: chapter.contentDraft ?? null,
    status: chapter.status,
    publishedAt: toIsoString(chapter.publishedAt),
    latestVersionId: chapter.latestVersionId ?? null,
    latestPublishedVersionId: chapter.latestPublishedVersionId ?? null,
    createdAt: chapter.createdAt.toISOString(),
    updatedAt: chapter.updatedAt.toISOString(),
  }
}

export function serializeChapterVersion(
  chapterVersion: ChapterVersion
): ChapterVersionDto {
  return {
    id: chapterVersion.id,
    chapterId: chapterVersion.chapterId,
    version: chapterVersion.version,
    previewText: chapterVersion.previewText,
    contentHash: chapterVersion.contentHash,
    publishState: chapterVersion.publishState,
    publishedEventId: chapterVersion.publishedEventId ?? null,
    publishedRelayCount: chapterVersion.publishedRelayCount,
    lastPublishError: chapterVersion.lastPublishError ?? null,
    publishRequestedAt: chapterVersion.publishRequestedAt.toISOString(),
    publishedAt: toIsoString(chapterVersion.publishedAt),
    createdAt: chapterVersion.createdAt.toISOString(),
    updatedAt: chapterVersion.updatedAt.toISOString(),
  }
}
