import { createHash } from "node:crypto"
import type { NotificationType } from "@prisma/client"
import { prisma } from "../client"
import { randomToken } from "../utils"

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function getOrCreateUserSetting(userId: string) {
  return prisma.userSetting.upsert({
    where: { userId },
    create: { userId },
    update: {},
  })
}

export async function updateUserSetting(
  userId: string,
  input: Partial<{
    emailNotifications: boolean
    appearanceTheme: "LIGHT" | "DARK" | "SYSTEM"
    readerFontSize: "SMALL" | "MEDIUM" | "LARGE"
  }>
) {
  return prisma.userSetting.upsert({
    where: { userId },
    create: {
      userId,
      emailNotifications: input.emailNotifications ?? true,
      appearanceTheme: input.appearanceTheme ?? "SYSTEM",
      readerFontSize: input.readerFontSize ?? "MEDIUM",
    },
    update: input,
  })
}

export async function getNotificationPreferencesForUser(userId: string, types: NotificationType[]) {
  return prisma.notificationPreference.findMany({
    where: {
      userId,
      type: {
        in: types,
      },
    },
  })
}

export async function getNotificationPreferencesForUsers(
  userIds: string[],
  types: NotificationType[]
) {
  if (userIds.length === 0) {
    return []
  }

  return prisma.notificationPreference.findMany({
    where: {
      userId: {
        in: userIds,
      },
      type: {
        in: types,
      },
    },
  })
}

export async function filterUserIdsByNotificationPreference(
  userIds: string[],
  type: NotificationType
) {
  if (userIds.length === 0) {
    return []
  }

  const disabledPreferences = await prisma.notificationPreference.findMany({
    where: {
      userId: {
        in: userIds,
      },
      type,
      OR: [
        {
          enabled: false,
        },
        {
          mutedUntil: {
            gt: new Date(),
          },
        },
      ],
    },
    select: {
      userId: true,
    },
  })

  const disabledUserIds = new Set(
    disabledPreferences.map((preference) => preference.userId)
  )

  return userIds.filter((userId) => !disabledUserIds.has(userId))
}

export async function setNotificationPreferencesForUser(
  userId: string,
  entries: Array<{ type: NotificationType; enabled: boolean }>
) {
  await prisma.$transaction(
    entries.map((entry) =>
      prisma.notificationPreference.upsert({
        where: {
          userId_type: {
            userId,
            type: entry.type,
          },
        },
        create: {
          userId,
          type: entry.type,
          enabled: entry.enabled,
        },
        update: {
          enabled: entry.enabled,
          mutedUntil: null,
        },
      })
    )
  )

  await prisma.user.update({
    where: { id: userId },
    data: {
      notificationPreset: "CUSTOM",
      notificationPresetUpdatedAt: new Date(),
    },
  })
}

export async function listAuthAuditLogsForUser(
  userId: string,
  options?: {
    limit?: number
  }
) {
  return prisma.authAuditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    ...(options?.limit ? { take: options.limit } : {}),
  })
}

export async function listRecentAuthAuditLogsForUser(userId: string, limit = 10) {
  return listAuthAuditLogsForUser(userId, { limit })
}

export async function listApiKeysForUser(userId: string) {
  return prisma.userApiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function createApiKeyForUser(userId: string, name: string) {
  const rawToken = `mist_${randomToken(24)}`
  const preview = `${rawToken.slice(0, 10)}...${rawToken.slice(-6)}`

  const apiKey = await prisma.userApiKey.create({
    data: {
      userId,
      name,
      keyPreview: preview,
      keyHash: hashToken(rawToken),
    },
  })

  return {
    apiKey,
    token: rawToken,
  }
}

export async function revokeApiKeyForUser(userId: string, apiKeyId: string) {
  return prisma.userApiKey.updateMany({
    where: {
      id: apiKeyId,
      userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  })
}

export async function listRelaysForUser(userId: string) {
  return prisma.userRelay.findMany({
    where: { userId },
    orderBy: [{ createdAt: "asc" }],
  })
}

export async function createRelayForUser(input: {
  userId: string
  url: string
  read: boolean
  write: boolean
}) {
  return prisma.userRelay.create({
    data: input,
  })
}

export async function findRelayByIdForUser(userId: string, relayId: string) {
  return prisma.userRelay.findFirst({
    where: {
      id: relayId,
      userId,
    },
  })
}

export async function updateRelayForUser(input: {
  userId: string
  relayId: string
  url: string
  read: boolean
  write: boolean
}) {
  const existing = await findRelayByIdForUser(input.userId, input.relayId)
  if (!existing) {
    return null
  }

  return prisma.userRelay.update({
    where: {
      id: input.relayId,
    },
    data: {
      url: input.url,
      read: input.read,
      write: input.write,
    },
  })
}

export async function deleteRelayForUser(userId: string, relayId: string) {
  return prisma.userRelay.deleteMany({
    where: {
      id: relayId,
      userId,
    },
  })
}
