import { randomUUID } from "node:crypto"
import { createAuthAuditLog, serializeUser, upsertUserByPubkey } from "@mist/db"
import {
  AUTH_CHALLENGE_TTL_SECONDS,
  SESSION_TTL_SECONDS,
  createRedisClient,
  redisKeys,
} from "@mist/redis"
import type { AuthUserDto, SignedNostrEvent } from "@mist/shared"
import { verifyEvent } from "nostr-tools"
import { env } from "../config/env"
import { HttpError } from "../utils/http-error"

const redis = createRedisClient(env.REDIS_URL)

function getRequestMeta(input: {
  method: string
  path: string
  pubkey?: string
  userId?: string
  detail?: string
  resultCode: string
}) {
  return {
    method: input.method,
    path: input.path,
    pubkey: input.pubkey,
    userId: input.userId,
    detail: input.detail,
    resultCode: input.resultCode,
  }
}

export async function issueChallenge(pubkey: string) {
  const challenge = `mist-story:${randomUUID()}`
  const expiresAt = new Date(Date.now() + AUTH_CHALLENGE_TTL_SECONDS * 1000)

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
}) {
  await createAuthAuditLog({
    action: "VERIFY_ATTEMPT",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/verify",
      pubkey: input.pubkey,
      resultCode: "attempt",
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
        detail: "Challenge mismatch",
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
        detail: "Invalid Nostr signature",
      }),
    })
    throw new HttpError(401, "Invalid signed event")
  }

  const user = await upsertUserByPubkey(input.pubkey)
  const sessionId = randomUUID()

  await redis.set(
    redisKeys.session(sessionId),
    JSON.stringify({ userId: user.id }),
    "EX",
    SESSION_TTL_SECONDS
  )
  await redis.del(redisKeys.authChallenge(input.pubkey))

  await createAuthAuditLog({
    action: "VERIFY_SUCCESS",
    ...getRequestMeta({
      method: "POST",
      path: "/api/v1/auth/verify",
      pubkey: input.pubkey,
      userId: user.id,
      resultCode: "verified",
    }),
  })

  return {
    sessionId,
    user: serializeUser(user) satisfies AuthUserDto,
  }
}

export async function destroySession(sessionId: string) {
  await redis.del(redisKeys.session(sessionId))
}
