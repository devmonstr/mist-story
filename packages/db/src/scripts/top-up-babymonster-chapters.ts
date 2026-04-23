import { createHash } from "node:crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "../client"

const TARGET_AUTHOR_HANDLE = "babymonster"
const TARGET_CHAPTER_COUNT = 10_000
const DEFAULT_BATCH_SIZE = 400

type ChapterPointerLink = {
  chapterId: string
  versionId: string
}

function hashHex(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

function pad(value: number, width: number) {
  return value.toString().padStart(width, "0")
}

function buildChapterHtml(input: {
  novelTitle: string
  chapterTitle: string
  chapterNumber: number
}) {
  return [
    `<h1>${input.chapterTitle}</h1>`,
    `<p>${input.novelTitle} continues with chapter ${input.chapterNumber}.</p>`,
    `<p>This benchmark chapter was generated to stress-test Myth Story search, catalog, and reading performance with large chapter counts.</p>`,
    `<p>The scene keeps the serialization moving while preserving deterministic content for repeatable testing.</p>`,
  ].join("")
}

function buildPreviewText(novelTitle: string, chapterNumber: number) {
  return `${novelTitle} chapter ${chapterNumber} continues the benchmark serialization for large-scale catalog and reader testing.`
}

async function updateChapterLatestVersionPointers(links: ChapterPointerLink[]) {
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

async function topUpNovelToTarget(input: {
  novel: {
    id: string
    slug: string
    title: string
    chaptersCount: number
    publishedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }
  batchSize: number
}) {
  const existingCount = input.novel.chaptersCount
  const missingCount = TARGET_CHAPTER_COUNT - existingCount

  if (missingCount <= 0) {
    console.log(
      `[seed] ${input.novel.slug} already has ${existingCount} chapters, skipping`
    )
    return
  }

  console.log(
    `[seed] topping up ${input.novel.slug} from ${existingCount} to ${TARGET_CHAPTER_COUNT} chapters`
  )

  const basePublishedAt = input.novel.publishedAt ?? input.novel.createdAt
  const createdAt = new Date()

  for (
    let batchStartNumber = existingCount + 1;
    batchStartNumber <= TARGET_CHAPTER_COUNT;
    batchStartNumber += input.batchSize
  ) {
    const batchEndNumber = Math.min(
      batchStartNumber + input.batchSize - 1,
      TARGET_CHAPTER_COUNT
    )
    const chapters: Prisma.ChapterCreateManyInput[] = []
    const versions: Prisma.ChapterVersionCreateManyInput[] = []
    const chapterLinks: ChapterPointerLink[] = []

    for (
      let chapterNumber = batchStartNumber;
      chapterNumber <= batchEndNumber;
      chapterNumber += 1
    ) {
      const chapterId = `${input.novel.id}-chapter-${pad(chapterNumber, 5)}`
      const versionId = `${chapterId}-v1`
      const chapterTitle = `Chapter ${chapterNumber}: ${input.novel.title} ${pad(chapterNumber, 5)}`
      const chapterPublishedAt = new Date(
        basePublishedAt.getTime() + chapterNumber * 60 * 60 * 1000
      )
      const html = buildChapterHtml({
        novelTitle: input.novel.title,
        chapterTitle,
        chapterNumber,
      })

      chapters.push({
        id: chapterId,
        novelId: input.novel.id,
        number: chapterNumber,
        title: chapterTitle,
        note: "",
        contentDraft: html,
        status: "PUBLISHED",
        publishedAt: chapterPublishedAt,
        createdAt,
        updatedAt: createdAt,
      })

      versions.push({
        id: versionId,
        chapterId,
        version: 1,
        previewText: buildPreviewText(input.novel.title, chapterNumber),
        contentHash: hashHex(`${versionId}:content`),
        ciphertext: html,
        wrappedDek: hashHex(`${versionId}:wrappedDek`),
        wrappedDekIv: hashHex(`${versionId}:wrappedDekIv`).slice(0, 32),
        wrappedDekAuthTag: hashHex(`${versionId}:wrappedDekAuthTag`).slice(0, 32),
        masterKeyVersion: "benchmark-key-v1",
        publishState: "PUBLISHED",
        publishedRelayCount: 0,
        publishRequestedAt: chapterPublishedAt,
        publishedAt: chapterPublishedAt,
        createdAt,
        updatedAt: createdAt,
      })

      chapterLinks.push({
        chapterId,
        versionId,
      })
    }

    await prisma.chapter.createMany({ data: chapters })
    await prisma.chapterVersion.createMany({ data: versions })
    await updateChapterLatestVersionPointers(chapterLinks)

    console.log(
      `[seed] ${input.novel.slug} batch ${batchStartNumber}-${batchEndNumber} complete`
    )
  }

  await prisma.novel.update({
    where: { id: input.novel.id },
    data: {
      chaptersCount: TARGET_CHAPTER_COUNT,
      updatedAt: new Date(),
    },
  })
}

async function main() {
  const rawBatchSize = Number.parseInt(process.argv[2] ?? "", 10)
  const batchSize =
    Number.isFinite(rawBatchSize) && rawBatchSize > 0 ? rawBatchSize : DEFAULT_BATCH_SIZE

  const author = await prisma.user.findFirst({
    where: {
      OR: [
        { handle: { equals: TARGET_AUTHOR_HANDLE, mode: "insensitive" } },
        { displayName: { equals: "BABYMONSTER", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      handle: true,
      displayName: true,
      novels: {
        orderBy: { slug: "asc" },
        take: 4,
        select: {
          id: true,
          slug: true,
          title: true,
          chaptersCount: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  })

  if (!author) {
    throw new Error(`Could not find author ${TARGET_AUTHOR_HANDLE}`)
  }

  if (author.novels.length !== 4) {
    throw new Error(
      `Expected 4 novels for ${author.handle ?? author.displayName}, found ${author.novels.length}`
    )
  }

  console.log("[seed] target author", {
    id: author.id,
    handle: author.handle,
    displayName: author.displayName,
    batchSize,
  })

  for (const novel of author.novels) {
    await topUpNovelToTarget({
      novel,
      batchSize,
    })
  }

  const results = await prisma.novel.findMany({
    where: { authorId: author.id },
    orderBy: { slug: "asc" },
    select: {
      slug: true,
      title: true,
      chaptersCount: true,
      _count: {
        select: {
          chapters: true,
        },
      },
    },
  })

  console.log("[seed] final novel counts")
  for (const novel of results) {
    console.log(
      `${novel.slug} | ${novel.title} | chaptersCount=${novel.chaptersCount} | actualChapters=${novel._count.chapters}`
    )
  }
}

try {
  await main()
} finally {
  await prisma.$disconnect()
}
