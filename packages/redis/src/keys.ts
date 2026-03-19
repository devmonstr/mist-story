export const REDIS_PREFIX = "mist"

export const REDIS_NAMESPACES = {
  session: `${REDIS_PREFIX}:session`,
  authChallenge: `${REDIS_PREFIX}:auth-challenge`,
  cache: `${REDIS_PREFIX}:cache`,
  queue: `${REDIS_PREFIX}:queue`,
} as const

function joinKey(parts: Array<string | number | undefined | null>): string {
  return parts
    .filter((part): part is string | number => part !== undefined && part !== null && part !== "")
    .map(String)
    .join(":")
}

export function sessionKey(sessionId: string): string {
  return joinKey([REDIS_NAMESPACES.session, sessionId])
}

export function authChallengeKey(pubkey: string): string {
  return joinKey([REDIS_NAMESPACES.authChallenge, pubkey])
}

export function cacheKey(scope: string, ...parts: Array<string | number | undefined | null>): string {
  return joinKey([REDIS_NAMESPACES.cache, scope, ...parts])
}

export function queueKey(queueName: string, ...parts: Array<string | number | undefined | null>): string {
  return joinKey([REDIS_NAMESPACES.queue, queueName, ...parts])
}
