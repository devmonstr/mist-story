import { z } from "zod"

export const nostrProfileSchema = z.object({
  name: z.string().nullish(),
  display_name: z.string().nullish(),
  picture: z.string().url().nullish(),
  banner: z.string().url().nullish(),
  about: z.string().nullish(),
  nip05: z.string().nullish(),
  lud16: z.string().nullish(),
  website: z.string().url().nullish(),
})

export const authUserSchema = z.object({
  id: z.string(),
  pubkey: z.string(),
  npub: z.string(),
  isReader: z.boolean(),
  isWriter: z.boolean(),
  isAdmin: z.boolean(),
  profile: nostrProfileSchema.nullable(),
})

export const authChallengeRequestSchema = z.object({
  pubkey: z.string().min(1),
})

export const authChallengeResponseSchema = z.object({
  challenge: z.string(),
  expiresAt: z.string(),
})

export const authSessionPayloadSchema = z.object({
  userId: z.string(),
  createdAt: z.string(),
  lastVerifiedAt: z.string(),
  lastReauthenticatedAt: z.string().nullable(),
  ipAddress: z.string().nullable().optional(),
  ipHash: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  deviceLabel: z.string().nullable().optional(),
})

export const signedNostrEventSchema = z.object({
  id: z.string().optional(),
  pubkey: z.string(),
  created_at: z.number(),
  kind: z.number(),
  tags: z.array(z.array(z.string())),
  content: z.string(),
  sig: z.string().optional(),
})

export const authVerifyRequestSchema = z.object({
  pubkey: z.string().min(1),
  challenge: z.string().min(1),
  signedEvent: signedNostrEventSchema,
})

export const authVerifyResponseSchema = z.object({
  user: authUserSchema,
})

export const authMeResponseSchema = z.object({
  user: authUserSchema,
})

export const authReverifyRequestSchema = z.object({
  challenge: z.string().min(1),
  signedEvent: signedNostrEventSchema,
})

export const authReverifyResponseSchema = z.object({
  reauthenticatedAt: z.string(),
  validUntil: z.string(),
})

export type NostrProfileDto = z.infer<typeof nostrProfileSchema>
export type AuthUserDto = z.infer<typeof authUserSchema>
export type AuthChallengeRequest = z.infer<typeof authChallengeRequestSchema>
export type AuthChallengeResponse = z.infer<typeof authChallengeResponseSchema>
export type AuthSessionPayload = z.infer<typeof authSessionPayloadSchema>
export type SignedNostrEvent = z.infer<typeof signedNostrEventSchema>
export type AuthVerifyRequest = z.infer<typeof authVerifyRequestSchema>
export type AuthVerifyResponse = z.infer<typeof authVerifyResponseSchema>
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>
export type AuthReverifyRequest = z.infer<typeof authReverifyRequestSchema>
export type AuthReverifyResponse = z.infer<typeof authReverifyResponseSchema>
