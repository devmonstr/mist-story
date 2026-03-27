import {
  createApiKeyForUser,
  createRelayForUser,
  deleteRelayForUser,
  findRelayByIdForUser,
  findUserById,
  getNotificationPreferencesForUser,
  getOrCreateUserSetting,
  hexToNpub,
  listApiKeysForUser,
  listRecentAuthAuditLogsForUser,
  listRelaysForUser,
  revokeApiKeyForUser,
  updateUserSetting,
  updateRelayForUser,
  setNotificationPreferencesForUser,
} from "@mist/db"
import type {
  AppearanceSettings,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  CreateRelayInput,
  IntegrationSettings,
  NotificationSettings,
  SecuritySettings,
  UpdateRelayInput,
} from "@mist/shared"
import { HttpError } from "../utils/http-error"

const NEW_CHAPTER_TYPES = ["CHAPTER_PUBLISHED"] as const
const COMMENT_TYPES = ["COMMENT_REPLY", "COMMENT_LIKE"] as const
const FOLLOW_TYPES = ["USER_FOLLOWED"] as const
const SETTINGS_NOTIFICATION_TYPES = [
  ...NEW_CHAPTER_TYPES,
  ...COMMENT_TYPES,
  ...FOLLOW_TYPES,
] as const

function isPrismaUniqueConstraintError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "P2002"
  )
}

function toTheme(theme: "LIGHT" | "DARK" | "SYSTEM"): AppearanceSettings["theme"] {
  return theme.toLowerCase() as AppearanceSettings["theme"]
}

function toFontSize(
  fontSize: "SMALL" | "MEDIUM" | "LARGE"
): AppearanceSettings["fontSize"] {
  return fontSize.toLowerCase() as AppearanceSettings["fontSize"]
}

function fromTheme(theme: AppearanceSettings["theme"]) {
  return theme.toUpperCase() as "LIGHT" | "DARK" | "SYSTEM"
}

function fromFontSize(fontSize: AppearanceSettings["fontSize"]) {
  return fontSize.toUpperCase() as "SMALL" | "MEDIUM" | "LARGE"
}

function isGroupEnabled(
  enabledMap: Map<string, boolean>,
  types: readonly string[]
) {
  return types.every((type) => enabledMap.get(type) ?? true)
}

export async function getNotificationSettings(
  userId: string
): Promise<NotificationSettings> {
  const [userSetting, preferences] = await Promise.all([
    getOrCreateUserSetting(userId),
    getNotificationPreferencesForUser(userId, [...SETTINGS_NOTIFICATION_TYPES]),
  ])

  const enabledMap = new Map(
    preferences.map((preference) => [preference.type, preference.enabled])
  )

  return {
    emailNotifications: userSetting.emailNotifications,
    newChapterNotifications: isGroupEnabled(enabledMap, NEW_CHAPTER_TYPES),
    commentNotifications: isGroupEnabled(enabledMap, COMMENT_TYPES),
    followNotifications: isGroupEnabled(enabledMap, FOLLOW_TYPES),
  }
}

export async function updateNotificationSettings(
  userId: string,
  input: NotificationSettings
): Promise<NotificationSettings> {
  await Promise.all([
    updateUserSetting(userId, {
      emailNotifications: input.emailNotifications,
    }),
    setNotificationPreferencesForUser(userId, [
      ...NEW_CHAPTER_TYPES.map((type) => ({
        type,
        enabled: input.newChapterNotifications,
      })),
      ...COMMENT_TYPES.map((type) => ({
        type,
        enabled: input.commentNotifications,
      })),
      ...FOLLOW_TYPES.map((type) => ({
        type,
        enabled: input.followNotifications,
      })),
    ]),
  ])

  return getNotificationSettings(userId)
}

export async function getAppearanceSettings(userId: string): Promise<AppearanceSettings> {
  const userSetting = await getOrCreateUserSetting(userId)
  return {
    theme: toTheme(userSetting.appearanceTheme),
    fontSize: toFontSize(userSetting.readerFontSize),
  }
}

export async function updateAppearanceSettings(
  userId: string,
  input: AppearanceSettings
): Promise<AppearanceSettings> {
  await updateUserSetting(userId, {
    appearanceTheme: fromTheme(input.theme),
    readerFontSize: fromFontSize(input.fontSize),
  })

  return getAppearanceSettings(userId)
}

export async function getSecuritySettings(userId: string): Promise<SecuritySettings> {
  const [user, activity] = await Promise.all([
    findUserById(userId),
    listRecentAuthAuditLogsForUser(userId, 10),
  ])

  if (!user) {
    throw new HttpError(404, "User not found")
  }

  return {
    npub: hexToNpub(user.pubkey),
    pubkey: user.pubkey,
    recentAuthActivity: activity.map((item) => ({
      id: item.id,
      action: item.action,
      resultCode: item.resultCode,
      detail: item.detail ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  }
}

export async function getIntegrationSettings(userId: string): Promise<IntegrationSettings> {
  const [apiKeys, relays] = await Promise.all([
    listApiKeysForUser(userId),
    listRelaysForUser(userId),
  ])

  return {
    apiKeys: apiKeys.map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      keyPreview: apiKey.keyPreview,
      lastUsedAt: apiKey.lastUsedAt?.toISOString() ?? null,
      createdAt: apiKey.createdAt.toISOString(),
      revokedAt: apiKey.revokedAt?.toISOString() ?? null,
    })),
    relays: relays.map((relay) => ({
      id: relay.id,
      url: relay.url,
      read: relay.read,
      write: relay.write,
      createdAt: relay.createdAt.toISOString(),
      updatedAt: relay.updatedAt.toISOString(),
    })),
  }
}

export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput
): Promise<CreateApiKeyResponse> {
  const created = await createApiKeyForUser(userId, input.name)

  return {
    apiKey: {
      id: created.apiKey.id,
      name: created.apiKey.name,
      keyPreview: created.apiKey.keyPreview,
      lastUsedAt: created.apiKey.lastUsedAt?.toISOString() ?? null,
      createdAt: created.apiKey.createdAt.toISOString(),
      revokedAt: created.apiKey.revokedAt?.toISOString() ?? null,
    },
    token: created.token,
  }
}

export async function revokeApiKey(userId: string, apiKeyId: string) {
  const result = await revokeApiKeyForUser(userId, apiKeyId)
  if (result.count === 0) {
    throw new HttpError(404, "API key not found")
  }
}

export async function createRelay(userId: string, input: CreateRelayInput) {
  let relay

  try {
    relay = await createRelayForUser({
      userId,
      url: input.url,
      read: input.read,
      write: input.write,
    })
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new HttpError(409, "You already have a relay with this URL")
    }

    throw error
  }

  return {
    id: relay.id,
    url: relay.url,
    read: relay.read,
    write: relay.write,
    createdAt: relay.createdAt.toISOString(),
    updatedAt: relay.updatedAt.toISOString(),
  }
}

export async function updateRelay(
  userId: string,
  relayId: string,
  input: UpdateRelayInput
) {
  const existing = await findRelayByIdForUser(userId, relayId)
  if (!existing) {
    throw new HttpError(404, "Relay not found")
  }

  let relay

  try {
    relay = await updateRelayForUser({
      userId,
      relayId,
      url: input.url,
      read: input.read,
      write: input.write,
    })
  } catch (error) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new HttpError(409, "You already have a relay with this URL")
    }

    throw error
  }

  if (!relay) {
    throw new HttpError(404, "Relay not found")
  }

  return {
    id: relay.id,
    url: relay.url,
    read: relay.read,
    write: relay.write,
    createdAt: relay.createdAt.toISOString(),
    updatedAt: relay.updatedAt.toISOString(),
  }
}

export async function deleteRelay(userId: string, relayId: string) {
  const result = await deleteRelayForUser(userId, relayId)
  if (result.count === 0) {
    throw new HttpError(404, "Relay not found")
  }
}
