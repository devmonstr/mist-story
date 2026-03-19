import { prisma } from "../client"

export async function markUserProfileFetchAttempt(pubkey: string, fetchedAt = new Date()) {
  await prisma.user.updateMany({
    where: { pubkey },
    data: {
      profileFetchedAt: fetchedAt,
    },
  })
}

export async function saveUserNostrProfileSnapshot(input: {
  pubkey: string
  handle: string | null
  displayName: string | null
  about: string | null
  avatarUrl: string | null
  bannerUrl: string | null
  nip05: string | null
  lud16: string | null
  website: string | null
  profileEventId: string
  profileEventCreatedAt: Date
  profileFetchedAt: Date
}) {
  const current = await prisma.user.findUnique({
    where: { pubkey: input.pubkey },
    select: {
      profileEventCreatedAt: true,
    },
  })

  if (
    current?.profileEventCreatedAt &&
    current.profileEventCreatedAt > input.profileEventCreatedAt
  ) {
    await markUserProfileFetchAttempt(input.pubkey, input.profileFetchedAt)
    return prisma.user.findUnique({
      where: { pubkey: input.pubkey },
    })
  }

  return prisma.user.update({
    where: { pubkey: input.pubkey },
    data: {
      handle: input.handle,
      displayName: input.displayName,
      about: input.about,
      avatarUrl: input.avatarUrl,
      bannerUrl: input.bannerUrl,
      nip05: input.nip05,
      lud16: input.lud16,
      website: input.website,
      profileEventId: input.profileEventId,
      profileEventCreatedAt: input.profileEventCreatedAt,
      profileFetchedAt: input.profileFetchedAt,
    },
  })
}

export async function listPublishedProfileNovels(userId: string) {
  return prisma.novel.findMany({
    where: {
      authorId: userId,
      visibility: "PUBLISHED",
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    include: {
      _count: {
        select: {
          readingProgress: true,
        },
      },
    },
  })
}

export async function getProfileSiteStats(userId: string) {
  const [novels, followers, following, totalReads] = await Promise.all([
    prisma.novel.count({
      where: {
        authorId: userId,
        visibility: "PUBLISHED",
      },
    }),
    prisma.userFollow.count({
      where: { followingId: userId },
    }),
    prisma.userFollow.count({
      where: { followerId: userId },
    }),
    prisma.readingProgress.count({
      where: {
        novel: {
          authorId: userId,
          visibility: "PUBLISHED",
        },
      },
    }),
  ])

  return {
    novels,
    followers,
    following,
    totalReads,
  }
}

export async function isFollowingUser(followerId: string, followingId: string) {
  const relation = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  })

  return Boolean(relation)
}

export async function followUser(followerId: string, followingId: string) {
  return prisma.userFollow.upsert({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
    create: {
      followerId,
      followingId,
    },
    update: {},
  })
}

export async function unfollowUser(followerId: string, followingId: string) {
  return prisma.userFollow.deleteMany({
    where: {
      followerId,
      followingId,
    },
  })
}

export async function listFollowerUsers(userId: string) {
  return prisma.userFollow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      follower: true,
    },
  })
}

export async function listFollowingUsers(userId: string) {
  return prisma.userFollow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      following: true,
    },
  })
}

export async function countFollowersForUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>()
  }

  const grouped = await prisma.userFollow.groupBy({
    by: ["followingId"],
    where: {
      followingId: {
        in: userIds,
      },
    },
    _count: {
      _all: true,
    },
  })

  return new Map(grouped.map((row) => [row.followingId, row._count._all]))
}

export async function countFollowingForUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>()
  }

  const grouped = await prisma.userFollow.groupBy({
    by: ["followerId"],
    where: {
      followerId: {
        in: userIds,
      },
    },
    _count: {
      _all: true,
    },
  })

  return new Map(grouped.map((row) => [row.followerId, row._count._all]))
}

export async function countPublishedNovelsForUsers(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, number>()
  }

  const grouped = await prisma.novel.groupBy({
    by: ["authorId"],
    where: {
      authorId: {
        in: userIds,
      },
      visibility: "PUBLISHED",
    },
    _count: {
      _all: true,
    },
  })

  return new Map(grouped.map((row) => [row.authorId, row._count._all]))
}
