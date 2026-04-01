import {
  countFollowersForUsers,
  countFollowingForUsers,
  countPublishedNovelsForUsers,
  hexToNpub,
  npubToHex,
  prisma,
} from "@mist/db"
import type {
  AdminNovelListQuery,
  AdminNovelListResponse,
  AdminNovelSummary,
  AdminRoleFlags,
  AdminStudioResponse,
  AdminUserListQuery,
  AdminUserListResponse,
} from "@mist/shared"
import type {
  UpdateAdminNovelVisibilityInput,
  UpdateAdminUserRolesInput,
} from "@mist/shared"
import { HttpError } from "../utils/http-error"

type AdminUserRecord = Awaited<ReturnType<typeof listAdminUserRecords>>[number]

function buildPagination(page: number, pageSize: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  return {
    page: Math.min(page, totalPages),
    pageSize,
    totalItems,
    totalPages,
  }
}

function normalizeAdminUserQuery(query: string) {
  const trimmed = query.trim()
  const normalized = trimmed.toLowerCase()
  const normalizedHandle = normalized.startsWith("@") ? normalized.slice(1) : normalized
  const npubAsHex = normalized.startsWith("npub1") ? npubToHex(normalized) : null
  const isHexPubkey = /^[0-9a-f]{64}$/i.test(trimmed)

  if (isHexPubkey) {
    return { pubkey: trimmed.toLowerCase() }
  }

  if (npubAsHex) {
    return { pubkey: npubAsHex }
  }

  return {
    OR: [
      { handle: { startsWith: normalizedHandle, mode: "insensitive" as const } },
      { displayName: { startsWith: trimmed, mode: "insensitive" as const } },
    ],
  }
}

function normalizeAdminNovelQuery(query: string) {
  const trimmed = query.trim()

  return {
    OR: [
      { slug: { equals: trimmed.toLowerCase(), mode: "insensitive" as const } },
      { title: { startsWith: trimmed, mode: "insensitive" as const } },
      { authorDisplayName: { startsWith: trimmed, mode: "insensitive" as const } },
    ],
  }
}

function buildAdminUserSummary(
  user: AdminUserRecord,
  counts: {
    followers: Map<string, number>
    following: Map<string, number>
    publishedNovels: Map<string, number>
  }
) {
  return {
    id: user.id,
    pubkey: user.pubkey,
    npub: hexToNpub(user.pubkey),
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
    profileFetchedAt: user.profileFetchedAt?.toISOString() ?? null,
    publishedNovels: counts.publishedNovels.get(user.id) ?? 0,
    followers: counts.followers.get(user.id) ?? 0,
    following: counts.following.get(user.id) ?? 0,
    roles: {
      isReader: user.isReader,
      isWriter: user.isWriter,
      isAdmin: user.isAdmin,
    },
  }
}

function buildAdminNovelSummary(novel: {
  id: string
  slug: string
  title: string
  authorId: string
  authorDisplayName: string
  visibility: "PUBLISHED" | "HIDDEN"
  status: "Ongoing" | "Completed" | "Hiatus"
  genre: string
  chaptersCount: number
  rating: { toNumber(): number }
  ratingsCount: number
  updatedAt: Date
  publishedAt: Date | null
}): AdminNovelSummary {
  return {
    id: novel.id,
    slug: novel.slug,
    title: novel.title,
    authorId: novel.authorId,
    authorDisplayName: novel.authorDisplayName,
    visibility: novel.visibility,
    status: novel.status,
    genre: novel.genre,
    chaptersCount: novel.chaptersCount,
    rating: novel.rating.toNumber(),
    ratingsCount: novel.ratingsCount,
    updatedAt: novel.updatedAt.toISOString(),
    publishedAt: novel.publishedAt?.toISOString() ?? null,
  }
}

async function listAdminUserRecords(take = 12) {
  return prisma.user.findMany({
    orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      pubkey: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      profileFetchedAt: true,
      createdAt: true,
      isReader: true,
      isWriter: true,
      isAdmin: true,
    },
  })
}

async function getAdminUserCounts(userIds: string[]) {
  const [followers, following, publishedNovels] = await Promise.all([
    countFollowersForUsers(userIds),
    countFollowingForUsers(userIds),
    countPublishedNovelsForUsers(userIds),
  ])

  return {
    followers,
    following,
    publishedNovels,
  }
}

export async function getAdminStudioSnapshot(): Promise<AdminStudioResponse> {
  const [overviewCounts, reports, payoutRequests] = await Promise.all([
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isReader: true } }),
      prisma.user.count({ where: { isWriter: true } }),
      prisma.user.count({ where: { isAdmin: true } }),
      prisma.novel.count(),
      prisma.novel.count({ where: { visibility: "PUBLISHED" } }),
      prisma.novel.count({ where: { visibility: "HIDDEN" } }),
      prisma.chapter.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.payoutRequest.count({
        where: {
          status: {
            in: ["REQUESTED", "QUEUED", "PROCESSING"],
          },
        },
      }),
      prisma.payoutRequest.count({ where: { status: "FAILED" } }),
    ]),
    prisma.report.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reporter: {
          select: {
            displayName: true,
            handle: true,
          },
        },
        comment: {
          select: {
            content: true,
            novelSlug: true,
            chapterNumber: true,
          },
        },
      },
    }),
    prisma.payoutRequest.findMany({
      where: {
        status: {
          in: ["REQUESTED", "QUEUED", "PROCESSING", "FAILED"],
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 8,
      select: {
        id: true,
        userId: true,
        amountSats: true,
        status: true,
        destination: true,
        createdAt: true,
        user: {
          select: {
            displayName: true,
            handle: true,
          },
        },
      },
    }),
  ])

  const [
    totalUsers,
    totalReaders,
    totalWriters,
    totalAdmins,
    totalNovels,
    publishedNovels,
    hiddenNovels,
    totalChapters,
    openReports,
    queuedPayoutRequests,
    failedPayoutRequests,
  ] = overviewCounts

  return {
    overview: {
      totalUsers,
      totalReaders,
      totalWriters,
      totalAdmins,
      totalNovels,
      publishedNovels,
      hiddenNovels,
      totalChapters,
      openReports,
      queuedPayoutRequests,
      failedPayoutRequests,
    },
    reports: reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      commentExcerpt: report.comment.content.slice(0, 160),
      novelSlug: report.comment.novelSlug,
      chapterNumber: report.comment.chapterNumber,
      reporterDisplayName: report.reporter.displayName ?? report.reporter.handle,
      createdAt: report.createdAt.toISOString(),
    })),
    payoutRequests: payoutRequests.map((request) => ({
      id: request.id,
      userId: request.userId,
      userDisplayName: request.user.displayName ?? request.user.handle,
      amountSats: request.amountSats,
      status: request.status,
      destination: request.destination,
      createdAt: request.createdAt.toISOString(),
    })),
  }
}

export async function listAdminUsers(
  input: AdminUserListQuery
): Promise<AdminUserListResponse> {
  const page = input.page
  const pageSize = input.pageSize
  const query = input.q?.trim()

  const where = {
    ...(input.role === "reader" ? { isReader: true } : {}),
    ...(input.role === "writer" ? { isWriter: true } : {}),
    ...(input.role === "admin" ? { isAdmin: true } : {}),
    ...(query ? normalizeAdminUserQuery(query) : {}),
  }

  const orderBy =
    input.sort === "name"
      ? [{ displayName: "asc" as const }, { handle: "asc" as const }, { createdAt: "desc" as const }]
      : [{ isAdmin: "desc" as const }, { createdAt: "desc" as const }]

  const totalItems = await prisma.user.count({ where })
  const pagination = buildPagination(page, pageSize, totalItems)
  const items = await prisma.user.findMany({
    where,
    orderBy,
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: {
      id: true,
      pubkey: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      profileFetchedAt: true,
      createdAt: true,
      isReader: true,
      isWriter: true,
      isAdmin: true,
    },
  })

  const counts = await getAdminUserCounts(items.map((item) => item.id))

  return {
    items: items.map((item) => buildAdminUserSummary(item, counts)),
    pagination,
  }
}

export async function listAdminNovels(
  input: AdminNovelListQuery
): Promise<AdminNovelListResponse> {
  const page = input.page
  const pageSize = input.pageSize
  const query = input.q?.trim()

  const where = {
    ...(input.visibility !== "all" ? { visibility: input.visibility } : {}),
    ...(input.status !== "all" ? { status: input.status } : {}),
    ...(query ? normalizeAdminNovelQuery(query) : {}),
  }

  const orderBy =
    input.sort === "title"
      ? [{ title: "asc" as const }, { updatedAt: "desc" as const }]
      : input.sort === "rating"
        ? [{ ratingsCount: "desc" as const }, { updatedAt: "desc" as const }]
        : [{ updatedAt: "desc" as const }]

  const totalItems = await prisma.novel.count({ where })
  const pagination = buildPagination(page, pageSize, totalItems)
  const items = await prisma.novel.findMany({
    where,
    orderBy,
    skip: (pagination.page - 1) * pagination.pageSize,
    take: pagination.pageSize,
    select: {
      id: true,
      slug: true,
      title: true,
      authorId: true,
      authorDisplayName: true,
      visibility: true,
      status: true,
      genre: true,
      chaptersCount: true,
      rating: true,
      ratingsCount: true,
      updatedAt: true,
      publishedAt: true,
    },
  })

  return {
    items: items.map((item) => buildAdminNovelSummary(item)),
    pagination,
  }
}

export async function updateAdminUserRoles(
  actorUserId: string,
  targetUserId: string,
  input: UpdateAdminUserRolesInput
) {
  const [targetUser, adminCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        pubkey: true,
        handle: true,
        displayName: true,
        avatarUrl: true,
        profileFetchedAt: true,
        createdAt: true,
        isReader: true,
        isWriter: true,
        isAdmin: true,
      },
    }),
    prisma.user.count({ where: { isAdmin: true } }),
  ])

  if (!targetUser) {
    throw new HttpError(404, "User not found")
  }

  const removingLastAdmin = targetUser.isAdmin && !input.isAdmin && adminCount <= 1
  if (removingLastAdmin) {
    throw new HttpError(400, "At least one admin must remain on the platform")
  }

  if (actorUserId === targetUserId && !input.isAdmin) {
    throw new HttpError(400, "You cannot remove your own admin access")
  }

  const updated = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isReader: input.isReader,
      isWriter: input.isWriter,
      isAdmin: input.isAdmin,
    },
    select: {
      id: true,
      pubkey: true,
      handle: true,
      displayName: true,
      avatarUrl: true,
      profileFetchedAt: true,
      createdAt: true,
      isReader: true,
      isWriter: true,
      isAdmin: true,
    },
  })

  const counts = await getAdminUserCounts([updated.id])
  return buildAdminUserSummary(updated, counts)
}

export async function updateAdminNovelVisibility(
  novelId: string,
  input: UpdateAdminNovelVisibilityInput
) {
  const existing = await prisma.novel.findUnique({
    where: { id: novelId },
    select: {
      id: true,
      publishedAt: true,
    },
  })

  if (!existing) {
    throw new HttpError(404, "Novel not found")
  }

  const updated = await prisma.novel.update({
    where: { id: novelId },
    data: {
      visibility: input.visibility,
      publishedAt:
        input.visibility === "PUBLISHED" ? existing.publishedAt ?? new Date() : existing.publishedAt,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      authorId: true,
      authorDisplayName: true,
      visibility: true,
      status: true,
      genre: true,
      chaptersCount: true,
      rating: true,
      ratingsCount: true,
      updatedAt: true,
      publishedAt: true,
    },
  })

  return buildAdminNovelSummary(updated)
}
