import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import { getNovelGenreLabel } from "@myth/shared"
import { ensureCatalogSearchInfrastructure } from "../catalog-search"
import { prisma } from "../client"

const SAMPLE_AUTHOR_HANDLE_PREFIX = "sample_author_"
const SAMPLE_NOVEL_SLUG_PREFIX = "sample-story-"

const GENRES = [
  "action",
  "adventure",
  "comedy",
  "drama",
  "fantasy",
  "romance",
  "sci-fi",
  "horror",
  "mystery",
  "thriller",
  "supernatural",
  "historical",
  "slice-of-life",
  "sports",
  "psychological",
  "martial-arts",
  "school-life",
  "wuxia",
  "xianxia",
  "xuanhuan",
  "cultivation",
  "isekai",
  "shounen",
  "shoujo",
  "seinen",
  "josei",
  "bl",
  "gl",
  "mature",
] as const

const SUBGENRES_BY_GENRE: Record<(typeof GENRES)[number], string[]> = {
  action: ["mercenary", "survival", "street fight", "high stakes"],
  adventure: ["treasure hunt", "coming of age", "expedition", "high seas"],
  comedy: ["rom-com", "satire", "fish out of water", "ensemble cast"],
  drama: ["family drama", "coming of age", "workplace", "small town"],
  fantasy: ["epic fantasy", "magic academy", "sword and sorcery", "portal fantasy"],
  romance: ["slow burn", "enemies to lovers", "second chance", "heartwarming"],
  "sci-fi": ["space opera", "cyberpunk", "time travel", "post-apocalyptic"],
  horror: ["supernatural", "folk horror", "haunted house", "body horror"],
  mystery: ["detective", "cozy mystery", "whodunit", "locked room"],
  thriller: ["psychological", "crime", "political", "survival"],
  supernatural: ["ghost story", "urban legend", "curses", "spirit world"],
  historical: ["royal court", "war drama", "period mystery", "family saga"],
  "slice-of-life": ["healing", "school life", "friendship", "daily life"],
  sports: ["tournament", "underdog", "rivalry", "teamwork"],
  psychological: ["mind games", "trauma", "identity", "obsession"],
  "martial-arts": ["dojo rivalry", "tournament", "training arc", "master disciple"],
  "school-life": ["classroom", "club activities", "youth", "campus romance"],
  wuxia: ["jianghu", "sword sect", "honor", "wandering hero"],
  xianxia: ["immortals", "dao heart", "heavenly tribulation", "spiritual roots"],
  xuanhuan: ["ancient clans", "beast souls", "mystic realms", "bloodlines"],
  cultivation: ["qi refining", "breakthrough", "alchemy", "sect competition"],
  isekai: ["rebirth", "summoned hero", "game world", "cheat skill"],
  shounen: ["friendship", "training arc", "rivalry", "big dreams"],
  shoujo: ["first love", "friendship", "self-discovery", "emotional growth"],
  seinen: ["politics", "moral conflict", "survival", "adult life"],
  josei: ["career", "adult romance", "family", "healing"],
  bl: ["slow burn", "roommates", "reunion", "mutual healing"],
  gl: ["first love", "rivals", "slice of life", "mutual healing"],
  mature: ["dark fantasy", "crime", "political intrigue", "high-stakes conflict"],
}

const TITLE_PREFIXES = [
  "Whispering",
  "Crimson",
  "Neon",
  "Silent",
  "Emerald",
  "Midnight",
  "Shattered",
  "Velvet",
  "Radiant",
  "Fallen",
  "Gilded",
  "Burning",
  "Hidden",
  "Broken",
  "Golden",
  "Last",
  "Lost",
  "Electric",
  "Frozen",
  "Luminous",
] as const

const TITLE_CORE = [
  "Kingdom",
  "Letters",
  "Comet",
  "Labyrinth",
  "Promise",
  "Archive",
  "Garden",
  "Empire",
  "Signal",
  "Ballad",
  "Chronicle",
  "Voyage",
  "Mask",
  "Theorem",
  "Lantern",
  "Requiem",
  "Orbit",
  "Mirror",
  "Harbor",
  "Paradox",
] as const

const TITLE_SUFFIXES = [
  "of Dawn",
  "at Winterfall",
  "for the Exiled",
  "in Blue Fire",
  "Beyond the Ninth Gate",
  "of the Tidal Moon",
  "under Hollow Skies",
  "of Forgotten Names",
  "at the Last Station",
  "for a Distant Summer",
  "and the Iron Garden",
  "of Glass and Thunder",
] as const

const CONTENT_SNIPPETS = [
  "The corridor smelled of rain and old paper as the next choice quietly rearranged everything.",
  "No one in the city believed the story anymore, but the evidence kept arriving at the door before dawn.",
  "What began as a promise to survive slowly turned into a map toward something stranger and much larger.",
  "Each answer only opened a sharper question, and the question refused to let anyone sleep.",
  "By the time the signal reached the harbor, every witness had already told a different version of the same truth.",
  "The room was small, the stakes were not, and the silence between them carried more danger than any weapon.",
  "Even victory felt temporary here, like a borrowed coat that would soon have to be returned.",
  "He wrote the plan as if plans could save people; she read it as if reading could save the world.",
] as const

type Options = {
  novels: number
  minChapters: number
  maxChapters: number
  batchSize: number
  authorCount: number
}

type AuthorSeed = {
  id: string
  pubkey: string
  handle: string
  displayName: string
  about: string
}

type ChapterLink = {
  chapterId: string
  versionId: string
}

function readNumberFlag(flag: string, fallback: number) {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return fallback
  }

  const raw = process.argv[index + 1]
  const parsed = Number.parseInt(raw ?? "", 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid value for ${flag}: ${raw ?? "<missing>"}`)
  }

  return parsed
}

function getOptions(): Options {
  const novels = readNumberFlag("--novels", 20_000)
  const minChapters = readNumberFlag("--min-chapters", 20)
  const maxChapters = readNumberFlag("--max-chapters", 50)
  const batchSize = readNumberFlag("--batch-size", 100)
  const authorCount = readNumberFlag("--authors", 240)

  if (maxChapters < minChapters) {
    throw new Error("--max-chapters must be greater than or equal to --min-chapters")
  }

  return {
    novels,
    minChapters,
    maxChapters,
    batchSize,
    authorCount,
  }
}

function hashHex(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function createRng(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function pick<T>(items: readonly T[], rng: () => number) {
  return items[Math.floor(rng() * items.length)]
}

function pickMany<T>(items: readonly T[], count: number, rng: () => number) {
  const unique = new Set<T>()

  while (unique.size < Math.min(count, items.length)) {
    unique.add(pick(items, rng))
  }

  return Array.from(unique)
}

function pad(value: number, width: number) {
  return value.toString().padStart(width, "0")
}

function buildTitle(index: number, rng: () => number) {
  const prefix = pick(TITLE_PREFIXES, rng)
  const core = pick(TITLE_CORE, rng)
  const suffix = pick(TITLE_SUFFIXES, rng)
  return `${prefix} ${core} ${suffix} ${pad(index, 5)}`
}

function buildAuthorSeeds(authorCount: number): AuthorSeed[] {
  return Array.from({ length: authorCount }, (_, offset) => {
    const index = offset + 1
    const handle = `${SAMPLE_AUTHOR_HANDLE_PREFIX}${pad(index, 4)}`
    const displayName = `Sample Author ${pad(index, 3)}`
    return {
      id: `sample-user-${pad(index, 4)}`,
      pubkey: hashHex(`myth-sample-author-${index}`),
      handle,
      displayName,
      about: `${displayName} writes benchmark novels for Myth Story search and catalog testing.`,
    }
  })
}

function buildSummary(input: {
  title: string
  genre: string
  workType: "ORIGINAL" | "TRANSLATION"
  subgenres: string[]
}) {
  const modeLabel = input.workType === "TRANSLATION" ? "translated serial" : "original serial"
  return `${input.title} is a ${modeLabel} in ${getNovelGenreLabel(input.genre).toLowerCase()} with ${input.subgenres.join(", ")} elements, crafted as benchmark content for large-scale catalog and search testing.`
}

function buildChapterHtml(input: {
  novelTitle: string
  chapterTitle: string
  genre: string
  chapterNumber: number
  rng: () => number
}) {
  const intro = pick(CONTENT_SNIPPETS, input.rng)
  const middle = pick(CONTENT_SNIPPETS, input.rng)
  const outro = pick(CONTENT_SNIPPETS, input.rng)

  return [
    `<h1>${input.chapterTitle}</h1>`,
    `<p>${input.novelTitle} continues in chapter ${input.chapterNumber}, bringing a ${getNovelGenreLabel(input.genre).toLowerCase()} turn that keeps the cast moving toward the next revelation.</p>`,
    `<p>${intro}</p>`,
    `<p>${middle}</p>`,
    `<p>${outro}</p>`,
  ].join("")
}

async function cleanupExistingSampleData() {
  console.log("[seed] removing old sample novels and authors if present")

  await prisma.novel.deleteMany({
    where: {
      slug: {
        startsWith: SAMPLE_NOVEL_SLUG_PREFIX,
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      handle: {
        startsWith: SAMPLE_AUTHOR_HANDLE_PREFIX,
      },
    },
  })
}

async function seedAuthors(authors: AuthorSeed[]) {
  await prisma.user.createMany({
    data: authors.map((author) => ({
      id: author.id,
      pubkey: author.pubkey,
      handle: author.handle,
      displayName: author.displayName,
      about: author.about,
      isReader: true,
      isWriter: true,
      isAdmin: false,
    })),
  })
}

async function updateChapterLatestVersionPointers(links: ChapterLink[]) {
  if (links.length === 0) {
    return
  }

  const values = Prisma.join(
    links.map((link) => Prisma.sql`(${link.chapterId}, ${link.versionId}, ${link.versionId})`)
  )

  await prisma.$executeRaw`
    UPDATE "Chapter" AS c
    SET
      "latestVersionId" = source."latestVersionId",
      "latestPublishedVersionId" = source."latestPublishedVersionId"
    FROM (
      VALUES ${values}
    ) AS source("chapterId", "latestVersionId", "latestPublishedVersionId")
    WHERE c."id" = source."chapterId"
  `
}

async function analyzeSeededTables() {
  for (const table of ["User", "Novel", "Chapter", "ChapterVersion"] as const) {
    await prisma.$executeRawUnsafe(`ANALYZE "${table}"`)
  }
}

async function main() {
  const options = getOptions()
  const rng = createRng(20260323)
  const authors = buildAuthorSeeds(options.authorCount)
  const now = Date.now()

  console.log("[seed] options", options)
  await cleanupExistingSampleData()
  await seedAuthors(authors)

  let insertedNovels = 0
  let insertedChapters = 0
  let insertedVersions = 0

  for (let batchStart = 1; batchStart <= options.novels; batchStart += options.batchSize) {
    const batchEnd = Math.min(batchStart + options.batchSize - 1, options.novels)
    const novels: Prisma.NovelCreateManyInput[] = []
    const chapters: Prisma.ChapterCreateManyInput[] = []
    const versions: Prisma.ChapterVersionCreateManyInput[] = []
    const chapterLinks: ChapterLink[] = []

    for (let index = batchStart; index <= batchEnd; index += 1) {
      const author = authors[(index - 1) % authors.length]
      const genre = pick(GENRES, rng)
      const subgenres = pickMany(SUBGENRES_BY_GENRE[genre], 2, rng)
      const workType = rng() < 0.18 ? "TRANSLATION" : "ORIGINAL"
      const statusRoll = rng()
      const status = statusRoll < 0.72 ? "Ongoing" : statusRoll < 0.94 ? "Completed" : "Hiatus"
      const chapterCount =
        options.minChapters +
        Math.floor(rng() * (options.maxChapters - options.minChapters + 1))
      const title = buildTitle(index, rng)
      const publishedAt = new Date(now - Math.floor(rng() * 730) * 24 * 60 * 60 * 1000)
      const updatedAt = new Date(publishedAt.getTime() + Math.floor(rng() * 120) * 24 * 60 * 60 * 1000)
      const ratingCount = Math.floor(rng() * 250)
      const ratingValue = ratingCount === 0 ? 0 : Number((3.2 + rng() * 1.8).toFixed(1))
      const novelId = `sample-novel-${pad(index, 6)}`
      const slug = `${SAMPLE_NOVEL_SLUG_PREFIX}${pad(index, 6)}`

      novels.push({
        id: novelId,
        slug,
        title,
        summary: buildSummary({
          title,
          genre,
          workType,
          subgenres,
        }),
        genre,
        workType,
        subgenres,
        tags: [
          genre,
          subgenres[0].replaceAll(" ", "-"),
          workType === "TRANSLATION" ? "translated" : "original",
          "benchmark",
        ],
        authorDisplayName: author.displayName,
        translatorName: workType === "TRANSLATION" ? `Translator ${pad(index, 5)}` : "",
        status,
        visibility: "PUBLISHED",
        contentWarning: rng() < 0.12 ? "Contains mature themes and high-stakes conflict." : "",
        rating: new Prisma.Decimal(ratingValue.toFixed(1)),
        ratingsCount: ratingCount,
        updateNote: `Benchmark sample novel ${pad(index, 5)} for large-scale search testing.`,
        coverUrl: "",
        chaptersCount: chapterCount,
        authorId: author.id,
        publishedAt,
        updatedAt,
      })

      for (let chapterNumber = 1; chapterNumber <= chapterCount; chapterNumber += 1) {
        const chapterId = `sample-chapter-${pad(index, 6)}-${pad(chapterNumber, 3)}`
        const versionId = `${chapterId}-v1`
        const chapterTitle = `Chapter ${chapterNumber}: ${pick(TITLE_CORE, rng)} ${pick(TITLE_SUFFIXES, rng)}`
        const chapterPublishedAt = new Date(
          publishedAt.getTime() + chapterNumber * 12 * 60 * 60 * 1000
        )
        const html = buildChapterHtml({
          novelTitle: title,
          chapterTitle,
          genre,
          chapterNumber,
          rng,
        })
        const previewText = `${title} chapter ${chapterNumber} follows a ${getNovelGenreLabel(genre).toLowerCase()} turn with ${pick(SUBGENRES_BY_GENRE[genre], rng)} tension and benchmark-friendly prose.`

        chapters.push({
          id: chapterId,
          novelId,
          number: chapterNumber,
          title: chapterTitle,
          note: "",
          contentDraft: html,
          status: "PUBLISHED",
          publishedAt: chapterPublishedAt,
          updatedAt,
        })

        versions.push({
          id: versionId,
          chapterId,
          version: 1,
          previewText,
          contentHash: hashHex(versionId),
          ciphertext: html,
          wrappedDek: hashHex(`${versionId}:wrappedDek`),
          wrappedDekIv: hashHex(`${versionId}:wrappedDekIv`).slice(0, 32),
          wrappedDekAuthTag: hashHex(`${versionId}:wrappedDekAuthTag`).slice(0, 32),
          masterKeyVersion: "sample-key-v1",
          publishState: "PUBLISHED",
          publishedEventId: null,
          publishedRelayCount: 0,
          lastPublishError: null,
          publishRequestedAt: chapterPublishedAt,
          publishedAt: chapterPublishedAt,
          updatedAt,
        })

        chapterLinks.push({
          chapterId,
          versionId,
        })
      }
    }

    await prisma.novel.createMany({ data: novels })
    await prisma.chapter.createMany({ data: chapters })
    await prisma.chapterVersion.createMany({ data: versions })
    await updateChapterLatestVersionPointers(chapterLinks)

    insertedNovels += novels.length
    insertedChapters += chapters.length
    insertedVersions += versions.length

    console.log(
      `[seed] batch ${batchStart}-${batchEnd} complete | novels=${insertedNovels}/${options.novels} chapters=${insertedChapters} versions=${insertedVersions}`
    )
  }

  await ensureCatalogSearchInfrastructure()
  await analyzeSeededTables()

  console.log("[seed] sample catalog ready", {
    authors: authors.length,
    novels: insertedNovels,
    chapters: insertedChapters,
    versions: insertedVersions,
  })
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
