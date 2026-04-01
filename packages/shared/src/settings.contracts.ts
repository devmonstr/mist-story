import { z } from "zod"

export function normalizeRelayUrl(value: string) {
  const url = new URL(value)
  url.hash = ""
  return url
    .toString()
    .replace(/\/(?=$|[?#])/, "")
}

const relayUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol
      return protocol === "ws:" || protocol === "wss:"
    } catch {
      return false
    }
  }, "Relay URL must start with ws:// or wss://")
  .transform(normalizeRelayUrl)

const relayRoleSchema = z
  .object({
    read: z.boolean(),
    write: z.boolean(),
  })
  .refine((value) => value.read || value.write, {
    message: "At least one relay role must be enabled",
  })

export const settingsThemeSchema = z.enum(["light", "dark", "system"])
export const settingsFontSizeSchema = z.enum(["small", "medium", "large"])

export const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  newChapterNotifications: z.boolean(),
  commentNotifications: z.boolean(),
  followNotifications: z.boolean(),
})

export const appearanceSettingsSchema = z.object({
  theme: settingsThemeSchema,
  fontSize: settingsFontSizeSchema,
})

export const securityActivityContextSchema = z.object({
  deviceLabel: z.string().nullable(),
  ipAddress: z.string().nullable(),
  ipHash: z.string().nullable(),
  userAgent: z.string().nullable(),
  origin: z.string().nullable(),
})

export const securityAuditDetailSchema = securityActivityContextSchema.extend({
  message: z.string().nullable(),
})

export const securityActivityItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  resultCode: z.string(),
  detail: z.string().nullable(),
  context: securityActivityContextSchema.optional(),
  createdAt: z.string(),
})

export const securitySessionItemSchema = securityActivityContextSchema.extend({
  id: z.string(),
  current: z.boolean(),
  createdAt: z.string(),
  authenticatedAt: z.string(),
  reauthenticatedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
})

export const securityReauthStatusSchema = z.object({
  required: z.boolean(),
  windowSeconds: z.number().int().positive(),
  reauthenticatedAt: z.string().nullable(),
  validUntil: z.string().nullable(),
})

export const securitySettingsSchema = z.object({
  npub: z.string(),
  pubkey: z.string(),
  recentAuthActivity: z.array(securityActivityItemSchema),
  activeSessions: z.array(securitySessionItemSchema).optional(),
  reauth: securityReauthStatusSchema.optional(),
})

export const securityAuditExportSchema = z.object({
  exportedAt: z.string(),
  items: z.array(securityActivityItemSchema),
})

export const revokeSecuritySessionResponseSchema = z.object({
  revoked: z.boolean(),
  sessionId: z.string(),
})

export const revokeAllSecuritySessionsResponseSchema = z.object({
  revokedCount: z.number().int().nonnegative(),
})

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  keyPreview: z.string(),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
  revokedAt: z.string().nullable(),
})

export const relaySettingsItemSchema = z.object({
  id: z.string(),
  url: relayUrlSchema,
  read: z.boolean(),
  write: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const integrationSettingsSchema = z.object({
  apiKeys: z.array(apiKeySchema),
  relays: z.array(relaySettingsItemSchema),
})

export const createApiKeyInputSchema = z.object({
  name: z.string().trim().min(1).max(64),
})

export const createApiKeyResponseSchema = z.object({
  apiKey: apiKeySchema,
  token: z.string(),
})

export const createRelayInputSchema = z.object({
  url: relayUrlSchema,
}).and(relayRoleSchema)

export const updateRelayInputSchema = z.object({
  url: relayUrlSchema,
}).and(relayRoleSchema)

export function serializeSecurityAuditDetail(
  input: Partial<SecurityAuditDetail>
) {
  const normalized: SecurityAuditDetail = {
    message: input.message ?? null,
    deviceLabel: input.deviceLabel ?? null,
    ipAddress: input.ipAddress ?? null,
    ipHash: input.ipHash ?? null,
    userAgent: input.userAgent ?? null,
    origin: input.origin ?? null,
  }

  if (Object.values(normalized).every((value) => value === null)) {
    return null
  }

  return JSON.stringify(normalized)
}

export function parseSecurityAuditDetail(detail: string | null | undefined) {
  if (!detail) {
    return {
      message: null,
      deviceLabel: null,
      ipAddress: null,
      ipHash: null,
      userAgent: null,
      origin: null,
    } satisfies SecurityAuditDetail
  }

  try {
    const parsed = securityAuditDetailSchema.partial().parse(JSON.parse(detail))
    return {
      message: parsed.message ?? null,
      deviceLabel: parsed.deviceLabel ?? null,
      ipAddress: parsed.ipAddress ?? null,
      ipHash: parsed.ipHash ?? null,
      userAgent: parsed.userAgent ?? null,
      origin: parsed.origin ?? null,
    } satisfies SecurityAuditDetail
  } catch {
    return {
      message: detail,
      deviceLabel: null,
      ipAddress: null,
      ipHash: null,
      userAgent: null,
      origin: null,
    } satisfies SecurityAuditDetail
  }
}

export type SettingsTheme = z.infer<typeof settingsThemeSchema>
export type SettingsFontSize = z.infer<typeof settingsFontSizeSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>
export type SecurityActivityContext = z.infer<typeof securityActivityContextSchema>
export type SecurityAuditDetail = z.infer<typeof securityAuditDetailSchema>
export type SecurityActivityItem = z.infer<typeof securityActivityItemSchema>
export type SecuritySessionItem = z.infer<typeof securitySessionItemSchema>
export type SecurityReauthStatus = z.infer<typeof securityReauthStatusSchema>
export type SecurityAuditExport = z.infer<typeof securityAuditExportSchema>
export type ApiKeyDto = z.infer<typeof apiKeySchema>
export type RelaySettingsItem = z.infer<typeof relaySettingsItemSchema>
export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>
export type CreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>
export type CreateRelayInput = z.infer<typeof createRelayInputSchema>
export type UpdateRelayInput = z.infer<typeof updateRelayInputSchema>
export type RevokeSecuritySessionResponse = z.infer<
  typeof revokeSecuritySessionResponseSchema
>
export type RevokeAllSecuritySessionsResponse = z.infer<
  typeof revokeAllSecuritySessionsResponseSchema
>
