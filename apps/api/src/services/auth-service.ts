import { createHash, randomUUID } from "node:crypto"
import type { Request } from "express"
import { createAuthAuditLog, serializeUser, upsertUserByPubkey } from "@mist/db"
import {
  AUTH_CHALLENGE_TTL_SECONDS,
  REAUTH_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createRedisClient,
  redisKeys,
} from "@mist/redis"
import { authSessionPayloadSchema, serializeSecurityAuditDetail } from "@mist/shared"
import type {
  AuthReverifyResponse,
  AuthSessionPayload,
  AuthUserDto,
  SignedNostrEvent,
} from "@mist/shared"
import { verifyEvent } from "nostr-tools"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"
import { ensureUserProfileHydrated } from "./profile-sync-service"

const redis = createRedisClient(env.REDIS_URL)

type SessionRecord = AuthSessionPayload

function getClientIp(request: Request) {
  const forwardedFor = request.headers["x-forwarded-for"]
  if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? null
  }

  return request.ip || request.socket.remoteAddress || null
}

function hashIp(ipAddress: string | null) {
  if (!ipAddress) {
    return null
  }

  return createHash("sha256").update(ipAddress).digest("hex")
}

function getClientRequestContext(request: Request) {
  const originHeader = request.headers.origin
  const userAgentHeader = request.headers["user-agent"]
  const ipAddress = getClientIp(request)

  return {
    origin: typeof originHeader === "string" && originHeader.trim().length > 0
      ? originHeader
      : null,
    userAgent:
      typeof userAgentHeader === "string" && userAgentHeader.trim().length > 0
        ? userAgentHeader
        : null,
    ipAddress,
    ipHash: hashIp(ipAddress),
    deviceLabel: deriveDeviceLabel(
      typeof userAgentHeader === "string" && userAgentHeader.trim().length > 0
        ? userAgentHeader
        : null
    ),
  }
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

function getRequestMeta(input: {
  method: string
  path: string
  pubkey?: string
  userId?: string
  detail?: string | null
  resultCode: string
  ipHash?: string | null
  userAgent?: string | null
  origin?: string | null
}): {
  method: string
  path: string
  pubkey?: string
  userId?: string
  detail?: string
  resultCode: string
  ipHash?: string
  userAgent?: string
  origin?: string
} {
  return {
    method: input.method,
    path: input.path,
    pubkey: input.pubkey,
    userId: input.userId,
    detail: input.detail ?? undefined,
    resultCode: input.resultCode,
    ipHash: input.ipHash ?? undefined,
    userAgent: input.userAgent ?? undefined,
    origin: input.origin ?? undefined,
  }
}

function buildAuditDetail(input: {
  detail?: string
  ipAddress?: string | null
  ipHash?: string | null
  origin?: string | null
  userAgent?: string | null
  deviceLabel?: string | null
}) {
  const metadata = {
    message: input.detail ?? null,
    deviceLabel: input.deviceLabel ?? null,
    ipAddress: input.ipAddress ?? null,
    ipHash: input.ipHash ?? null,
    origin: input.origin ?? null,
    userAgent: input.userAgent ?? null,
  }

  if (
    !metadata.message &&
    !metadata.deviceLabel &&
    !metadata.ipAddress &&
    !metadata.ipHash &&
    !metadata.origin &&
    !metadata.userAgent
  ) {
    return null
  }

  return serializeSecurityAuditDetail(metadata)
}

async function storeSession(sessionId: string, session: SessionRecord) {
  await redis
    .multi()
    .set(
      redisKeys.session(sessionId),
      JSON.stringify(session),
      "EX",
      SESSION_TTL_SECONDS
    )
    .sadd(redisKeys.userSessions(session.userId), sessionId)
    .expire(redisKeys.userSessions(session.userId), SESSION_TTL_SECONDS)
    .exec()
}

export async function touchSessionTtl(userId: string, sessionId: string) {
  await redis
    .multi()
    .expire(redisKeys.session(sessionId), SESSION_TTL_SECONDS)
    .expire(redisKeys.userSessions(userId), SESSION_TTL_SECONDS)
    .exec()
}

export async function getSessionRecord(sessionId: string) {
  const payload = await redis.get(redisKeys.session(sessionId))
  if (!payload) {
    return null
  }

  return authSessionPayloadSchema.parse(JSON.parse(payload))
}

export async function listSessionRecordsForUser(userId: string) {
  const sessionIds = await redis.smembers(redisKeys.userSessions(userId))
  if (sessionIds.length === 0) {
    return [] as Array<{ sessionId: string; session: SessionRecord }>
  }

  const pipeline = redis.pipeline()
  for (const sessionId of sessionIds) {
    pipeline.get(redisKeys.session(sessionId))
  }
  const responses = await pipeline.exec()

  const activeSessions: Array<{ sessionId: string; session: SessionRecord }> = []
  const staleSessionIds: string[] = []

  responses?.forEach((entry, index) => {
    const sessionId = sessionIds[index]
    const [error, payload] = entry ?? []

    if (error || typeof payload !== "string") {
      staleSessionIds.push(sessionId)
      return
    }

    activeSessions.push({
      sessionId,
      session: authSessionPayloadSchema.parse(JSON.parse(payload)),
    })
  })

  if (staleSessionIds.length > 0) {
    await redis.srem(redisKeys.userSessions(userId), ...staleSessionIds)
  }

  activeSessions.sort(
    (left, right) =>
      new Date(right.session.lastVerifiedAt).getTime() -
      new Date(left.session.lastVerifiedAt).getTime()
  )

  return activeSessions
}

export async function issueChallenge(pubkey: string, request?: Request) {
  const challenge = `mist-story:${randomUUID()}`
  const expiresAt = new Date(Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000)
  const requestContext = request ? getClientRequestContext(request) : null

  await redis.set(
    redisKeys.authChallenge(pubkey),
    JSON.stringify({ challenge, expiresAt: expiresAt.toISOString() }),
    "EX",
    AUTH_CHALLENGE_TTL_SECONDS
  )

  await createAuthAuditLog({
    action: "CHALLENGE_ISSUED",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/challenge",
      pubkey,
      resultCode: "issued",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  return {
    challenge,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function issueReauthChallenge(input: {
  sessionId: string
  pubkey: string
  userId: string
  request?: Request
}) {
  const challenge = `mist-story:reauth:${randomUUID()}`
  const expiresAt = new Date(Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000)
  const requestContext = input.request ? getClientRequestContext(input.request) : null

  await redis.set(
    redisKeys.reauthChallenge(input.sessionId),
    JSON.stringify({
      challenge,
      expiresAt: expiresAt.toISOString(),
      pubkey: input.pubkey,
    }),
    "EX",
    AUTH_CHALLENGE_TTL_SECONDS
  )

  await createAuthAuditLog({
    action: "CHALLENGE_ISSUED",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/re-auth/challenge",
      pubkey: input.pubkey,
      userId: input.userId,
      resultCode: "issued",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  return {
    challenge,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function verifyChallenge(input: {
  pubkey: string
  challenge: string
  signedEvent: SignedNostrEvent
}, request?: Request) {
  const requestContext = request ? getClientRequestContext(request) : null

  await createAuthAuditLog({
    action: "VERIFY_ATTEMPT",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/verify",
      pubkey: input.pubkey,
      resultCode: "attempt",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  const stored = await redis.get(redisKeys.authChallenge(input.pubkey))
  if (!stored) {
    throw new HttpError(400, "Challenge expired or missing")
  }

  const parsed = JSON.parse(stored) as { challenge: string }
  if (parsed.challenge !== input.challenge) {
    await createAuthAuditLog({
      action: "VERIFY_FAILURE",
      ...getRequestMeta({
        method: "POST",
        path: "/api/v1/auth/verify",
        pubkey: input.pubkey,
        resultCode: "challenge_mismatch",
        ipHash: requestContext?.ipHash,
        userAgent: requestContext?.userAgent,
        origin: requestContext?.origin,
        detail: buildAuditDetail({
          detail: "Challenge mismatch",
          ...requestContext,
        }),
      }),
    })
    throw new HttpError(400, "Challenge mismatch")
  }

  const isValidEvent =
    verifyEvent(input.signedEvent as Parameters<typeof verifyEvent>[0]) &&
    input.signedEvent.pubkey === input.pubkey &&
    input.signedEvent.content === input.challenge

  if (!isValidEvent) {
    await createAuthAuditLog({
      action: "VERIFY_FAILURE",
      ...getRequestMeta({
        method: "POST",
        path: "/api/v1/auth/verify",
        pubkey: input.pubkey,
        resultCode: "invalid_signature",
        ipHash: requestContext?.ipHash,
        userAgent: requestContext?.userAgent,
        origin: requestContext?.origin,
        detail: buildAuditDetail({
          detail: "Invalid Nostr signature",
          ...requestContext,
        }),
      }),
    })
    throw new HttpError(401, "Invalid signed event")
  }

  const user = await ensureUserProfileHydrated(await upsertUserByPubkey(input.pubkey))
  const sessionId = randomUUID()
  const now = new Date().toISOString()

  await storeSession(sessionId, {
    userId: user.id,
    createdAt: now,
    lastVerifiedAt: now,
    lastReauthenticatedAt: now,
    deviceLabel: requestContext?.deviceLabel ?? null,
    origin: requestContext?.origin ?? null,
    userAgent: requestContext?.userAgent ?? null,
    ipAddress: requestContext?.ipAddress ?? null,
    ipHash: requestContext?.ipHash ?? null,
  })
  await redis.del(redisKeys.authChallenge(input.pubkey))

  await createAuthAuditLog({
    action: "VERIFY_SUCCESS",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/verify",
      pubkey: input.pubkey,
      userId: user.id,
      resultCode: "verified",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  return {
    sessionId,
    user: serializeUser(user) satisfies AuthUserDto,
  }
}

export async function destroySession(sessionId: string) {
  const session = await getSessionRecord(sessionId)
  if (!session) {
    await redis.del(redisKeys.session(sessionId))
    return
  }

  await redis
    .multi()
    .del(redisKeys.session(sessionId))
    .srem(redisKeys.userSessions(session.userId), sessionId)
    .exec()
}

export async function destroyAllSessionsForUser(userId: string, options?: { keepSessionId?: string }) {
  const sessions = await listSessionRecordsForUser(userId)
  const sessionIds = sessions
    .map((entry) => entry.sessionId)
    .filter((sessionId) => sessionId !== options?.keepSessionId)

  if (sessionIds.length === 0) {
    return 0
  }

  const pipeline = redis.pipeline()
  for (const sessionId of sessionIds) {
    pipeline.del(redisKeys.session(sessionId))
    pipeline.srem(redisKeys.userSessions(userId), sessionId)
  }
  await pipeline.exec()

  return sessionIds.length
}

export async function markSessionReauthenticated(sessionId: string) {
  const session = await getSessionRecord(sessionId)
  if (!session) {
    throw new HttpError(401, "Session expired")
  }

  const updatedSession: SessionRecord = {
    ...session,
    lastReauthenticatedAt: new Date().toISOString(),
  }
  await storeSession(sessionId, updatedSession)
  return updatedSession
}

export function hasRecentReauthentication(session: SessionRecord | null) {
  if (!session) {
    return false
  }

  const reference = session.lastReauthenticatedAt ?? session.lastVerifiedAt
  const ageMs = Date.now() - new Date(reference).getTime()
  return ageMs <= REAUTH_TTL_SECONDS * 1000
}

export async function verifyReauthChallenge(input: {
  sessionId: string
  pubkey: string
  userId: string
  challenge: string
  signedEvent: SignedNostrEvent
  request?: Request
}): Promise<AuthReverifyResponse> {
  const requestContext = input.request ? getClientRequestContext(input.request) : null

  await createAuthAuditLog({
    action: "VERIFY_ATTEMPT",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/re-auth/verify",
      pubkey: input.pubkey,
      userId: input.userId,
      resultCode: "attempt",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  const stored = await redis.get(redisKeys.reauthChallenge(input.sessionId))
  if (!stored) {
    throw new HttpError(400, "Re-authentication challenge expired or missing")
  }

  const parsed = JSON.parse(stored) as { challenge: string; pubkey?: string }
  if (parsed.challenge !== input.challenge || parsed.pubkey !== input.pubkey) {
    await createAuthAuditLog({
      action: "VERIFY_FAILURE",
      ...getRequestMeta({
        method: "POST",
        path: "/api/v1/auth/re-auth/verify",
        pubkey: input.pubkey,
        userId: input.userId,
        resultCode: "challenge_mismatch",
        ipHash: requestContext?.ipHash,
        userAgent: requestContext?.userAgent,
        origin: requestContext?.origin,
        detail: buildAuditDetail({
          detail: "Challenge mismatch",
          ...requestContext,
        }),
      }),
    })
    throw new HttpError(400, "Challenge mismatch")
  }

  const isValidEvent =
    verifyEvent(input.signedEvent as Parameters<typeof verifyEvent>[0]) &&
    input.signedEvent.pubkey === input.pubkey &&
    input.signedEvent.content === input.challenge

  if (!isValidEvent) {
    await createAuthAuditLog({
      action: "VERIFY_FAILURE",
      ...getRequestMeta({
        method: "POST",
        path: "/api/v1/auth/re-auth/verify",
        pubkey: input.pubkey,
        userId: input.userId,
        resultCode: "invalid_signature",
        ipHash: requestContext?.ipHash,
        userAgent: requestContext?.userAgent,
        origin: requestContext?.origin,
        detail: buildAuditDetail({
          detail: "Invalid Nostr signature",
          ...requestContext,
        }),
      }),
    })
    throw new HttpError(401, "Invalid signed event")
  }

  const updatedSession = await markSessionReauthenticated(input.sessionId)
  await redis.del(redisKeys.reauthChallenge(input.sessionId))

  await createAuthAuditLog({
    action: "VERIFY_SUCCESS",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/re-auth/verify",
      pubkey: input.pubkey,
      userId: input.userId,
      resultCode: "reauthenticated",
      ipHash: requestContext?.ipHash,
      userAgent: requestContext?.userAgent,
      origin: requestContext?.origin,
      detail: buildAuditDetail(requestContext ?? {}),
    }),
  })

  const reauthenticatedAt =
    updatedSession.lastReauthenticatedAt ?? updatedSession.lastVerifiedAt

  return {
    reauthenticatedAt,
    validUntil: new Date(
      new Date(reauthenticatedAt).getTime() + REAUTH_TTL_SECONDS * 1000
    ).toISOString(),
  }
}
