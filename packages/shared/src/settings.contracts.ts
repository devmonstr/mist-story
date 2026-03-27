import { z } from "zod"

export function normalizeRelayUrl(value: string) {
  const url = new URL(value)
  url.hash = ""

  if (url.pathname === "/" && !url.search) {
    url.pathname = ""
  }

  return url.toString()
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

export const securityActivityItemSchema = z.object({
  id: z.string(),
  action: z.string(),
  resultCode: z.string(),
  detail: z.string().nullable(),
  createdAt: z.string(),
})

export const securitySettingsSchema = z.object({
  npub: z.string(),
  pubkey: z.string(),
  recentAuthActivity: z.array(securityActivityItemSchema),
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

export type SettingsTheme = z.infer<typeof settingsThemeSchema>
export type SettingsFontSize = z.infer<typeof settingsFontSizeSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>
export type AppearanceSettings = z.infer<typeof appearanceSettingsSchema>
export type SecuritySettings = z.infer<typeof securitySettingsSchema>
export type SecurityActivityItem = z.infer<typeof securityActivityItemSchema>
export type ApiKeyDto = z.infer<typeof apiKeySchema>
export type RelaySettingsItem = z.infer<typeof relaySettingsItemSchema>
export type IntegrationSettings = z.infer<typeof integrationSettingsSchema>
export type CreateApiKeyInput = z.infer<typeof createApiKeyInputSchema>
export type CreateApiKeyResponse = z.infer<typeof createApiKeyResponseSchema>
export type CreateRelayInput = z.infer<typeof createRelayInputSchema>
export type UpdateRelayInput = z.infer<typeof updateRelayInputSchema>
