import { prisma } from "../client"
import { slugify } from "../utils"

async function createUniqueNovelSlug(title: string) {
  const baseSlug = slugify(title)
  let slug = baseSlug
  let suffix = 1

  while (await prisma.novel.findUnique({ where: { slug } })) {
    suffix += 1
    slug = `${baseSlug}-${suffix}`
  }

  return slug
}

export async function listNovelsForAuthor(authorId: string) {
  return prisma.novel.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
  })
}

export async function listPublishedNovels() {
  return prisma.novel.findMany({
    where: { visibility: "PUBLISHED" },
    orderBy: { updatedAt: "desc" },
  })
}

export async function findNovelByIdOrSlug(identifier: string) {
  return prisma.novel.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
  })
}

export async function createNovelForAuthor(
  authorId: string,
  input: {
    title: string
    summary: string
    genre: string
    workType: "ORIGINAL" | "TRANSLATION"
    subgenres: string[]
    tags: string[]
    authorDisplayName: string
    translatorName: string
    status: "Ongoing" | "Completed" | "Hiatus"
    visibility: "PUBLISHED" | "HIDDEN"
    contentWarning: string
    updateNote: string
    coverUrl: string
    coverStorageKey?: string | null
    coverMimeType?: string | null
    coverOriginalName?: string | null
    coverFileSizeBytes?: number | null
    publishedAt?: Date | null
  }
) {
  const slug = await createUniqueNovelSlug(input.title)

  return prisma.novel.create({
    data: {
      ...input,
      slug,
      authorId,
    },
  })
}

export async function updateNovelForAuthor(
  authorId: string,
  novelId: string,
  input: Partial<{
    title: string
    summary: string
    genre: string
    workType: "ORIGINAL" | "TRANSLATION"
    subgenres: string[]
    tags: string[]
    authorDisplayName: string
    translatorName: string
    status: "Ongoing" | "Completed" | "Hiatus"
    visibility: "PUBLISHED" | "HIDDEN"
    contentWarning: string
    updateNote: string
    coverUrl: string
    coverStorageKey: string | null
    coverMimeType: string | null
    coverOriginalName: string | null
    coverFileSizeBytes: number | null
    publishedAt: Date | null
  }>
) {
  const existing = await prisma.novel.findUnique({
    where: { id: novelId },
  })

  if (!existing || existing.authorId !== authorId) {
    throw new Error("Novel not found")
  }

  const data: Partial<{
    title: string
    summary: string
    genre: string
    workType: "ORIGINAL" | "TRANSLATION"
    subgenres: string[]
    tags: string[]
    authorDisplayName: string
    translatorName: string
    status: "Ongoing" | "Completed" | "Hiatus"
    visibility: "PUBLISHED" | "HIDDEN"
    contentWarning: string
    updateNote: string
    coverUrl: string
    coverStorageKey: string | null
    coverMimeType: string | null
    coverOriginalName: string | null
    coverFileSizeBytes: number | null
    publishedAt: Date | null
    slug: string
  }> = { ...input }

  if (input.title) {
    data.title = input.title
    data.slug = await createUniqueNovelSlug(input.title)
  }

  return prisma.novel.update({
    where: { id: novelId },
    data,
  })
}
