import {
  createApiKeyForUser,
  createRelayForUser,
  deleteRelayForUser,
  findRelayByIdForUser,
  findUserById,
  getNotificationPreferencesForUser,
  getOrCreateUserSetting,
  hexToNpub,
  listAuthAuditLogsForUser,
  listApiKeysForUser,
  listRecentAuthAuditLogsForUser,
  listRelaysForUser,
  revokeApiKeyForUser,
  updateUserSetting,
  updateRelayForUser,
  setNotificationPreferencesForUser,
} from "@mist/db"
import { REAUTH_TTL_SECONDS } from "@mist/redis"
import {
  normalizeRelayUrl,
  parseSecurityAuditDetail,
} from "@mist/shared"
import type {
  AppearanceSettings,
  AuthSessionPayload,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  CreateRelayInput,
  IntegrationSettings,
  NotificationSettings,
  SecurityActivityItem,
  SecurityAuditExport,
  SecuritySettings,
  SecuritySessionItem,
  UpdateRelayInput,
} from "@mist/shared"
import { HttpError } from "../utils/http-error"
import {
  destroyAllSessionsForUser,
  destroySession,
  hasRecentReauthentication,
  listSessionRecordsForUser,
} from "./auth-service"

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

async function findRelayWithEquivalentUrl(
  userId: string,
  url: string,
  options?: {
    excludeRelayId?: string
  }
) {
  const normalizedUrl = normalizeRelayUrl(url)
  const relays = await listRelaysForUser(userId)

  return (
    relays.find(
      (relay) =>
        relay.id !== options?.excludeRelayId &&
        normalizeRelayUrl(relay.url) === normalizedUrl
    ) ?? null
  )
}

function isGroupEnabled(
  enabledMap: Map<string, boolean>,
  types: readonly string[]
) {
  return types.every((type) => enabledMap.get(type) ?? true)
}

function deriveDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return null
  }

  const normalized = userAgent.toLowerCase()
  const platform = normalized.includes("iphone") || normalized.includes("ios")
    ? "iPhone"
    : normalized.includes("ipad")
      ? "iPad"
      : normalized.includes("android")
        ? "Android"
        : normalized.includes("mac os")
          ? "Mac"
          : normalized.includes("windows")
            ? "Windows"
            : normalized.includes("linux")
              ? "Linux"
              : "Unknown device"

  const browser = normalized.includes("edg/")
    ? "Edge"
    : normalized.includes("chrome/")
      ? "Chrome"
      : normalized.includes("firefox/")
        ? "Firefox"
        : normalized.includes("safari/") && !normalized.includes("chrome/")
          ? "Safari"
          : normalized.includes("opr/")
            ? "Opera"
            : "Browser"

  return `${platform} · ${browser}`
}

function serializeSecurityActivity(input: {
  id: string
  action: string
  resultCode: string
  detail: string | null
  createdAt: Date
}): SecurityActivityItem {
  const parsed = parseSecurityAuditDetail(input.detail)

  return {
    id: input.id,
    action: input.action,
    resultCode: input.resultCode,
    detail: parsed.message,
    context: {
      deviceLabel: parsed.deviceLabel ?? deriveDeviceLabel(parsed.userAgent),
      ipAddress: parsed.ipAddress,
      ipHash: parsed.ipHash,
      userAgent: parsed.userAgent,
      origin: parsed.origin,
    },
    createdAt: input.createdAt.toISOString(),
  }
}

function serializeSecuritySession(input: {
  sessionId: string
  currentSessionId?: string
  session: AuthSessionPayload
}): SecuritySessionItem {
  const userAgent = input.session.userAgent ?? null
  const ipAddress = input.session.ipAddress ?? null
  const origin = input.session.origin ?? null

  return {
    id: input.sessionId,
    current: input.sessionId === input.currentSessionId,
    createdAt: input.session.createdAt,
    authenticatedAt: input.session.lastVerifiedAt,
    reauthenticatedAt: input.session.lastReauthenticatedAt,
    expiresAt: null,
    deviceLabel: input.session.deviceLabel ?? deriveDeviceLabel(userAgent),
    ipAddress,
    ipHash: null,
    userAgent,
    origin,
  }
}

function buildReauthStatus(session: AuthSessionPayload | null) {
  const reference = session
    ? session.lastReauthenticatedAt ?? session.lastVerifiedAt
    : null

  return {
    required: !hasRecentReauthentication(session),
    windowSeconds: REAUTH_TTL_SECONDS,
    reauthenticatedAt: session?.lastReauthenticatedAt ?? null,
    validUntil: reference
      ? new Date(
          new Date(reference).getTime() + REAUTH_TTL_SECONDS * 1000
        ).toISOString()
      : null,
  }
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

export async function getSecuritySettings(
  userId: string,
  options?: {
    currentSessionId?: string
    currentSession?: AuthSessionPayload | null
  }
): Promise<SecuritySettings> {
  const [user, activity, sessions] = await Promise.all([
    findUserById(userId),
    listRecentAuthAuditLogsForUser(userId, 10),
    listSessionRecordsForUser(userId),
  ])

  if (!user) {
    throw new HttpError(404, "User not found")
  }

  return {
    npub: hexToNpub(user.pubkey),
    pubkey: user.pubkey,
    recentAuthActivity: activity.map(serializeSecurityActivity),
    activeSessions: sessions.map((entry) =>
      serializeSecuritySession({
        sessionId: entry.sessionId,
        currentSessionId: options?.currentSessionId,
        session: entry.session,
      })
    ),
    reauth: buildReauthStatus(options?.currentSession ?? null),
  }
}

export async function exportSecurityAuditLog(
  userId: string
): Promise<SecurityAuditExport> {
  const logs = await listAuthAuditLogsForUser(userId)

  return {
    exportedAt: new Date().toISOString(),
    items: logs.map(serializeSecurityActivity),
  }
}

export async function revokeCurrentSecuritySession(sessionId: string) {
  await destroySession(sessionId)
}

export async function revokeAllSecuritySessions(userId: string) {
  return destroyAllSessionsForUser(userId)
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
      url: normalizeRelayUrl(relay.url),
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
  const normalizedUrl = normalizeRelayUrl(input.url)
  const existingRelay = await findRelayWithEquivalentUrl(userId, normalizedUrl)
  if (existingRelay) {
    throw new HttpError(409, "You already have a relay with this URL")
  }

  let relay

  try {
    relay = await createRelayForUser({
      userId,
      url: normalizedUrl,
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
    url: normalizeRelayUrl(relay.url),
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

  const normalizedUrl = normalizeRelayUrl(input.url)
  const existingRelay = await findRelayWithEquivalentUrl(userId, normalizedUrl, {
    excludeRelayId: relayId,
  })
  if (existingRelay) {
    throw new HttpError(409, "You already have a relay with this URL")
  }

  let relay

  try {
    relay = await updateRelayForUser({
      userId,
      relayId,
      url: normalizedUrl,
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
    url: normalizeRelayUrl(relay.url),
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
