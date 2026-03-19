import { prisma } from "../client"

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  })
}

export async function findUserByPubkey(pubkey: string) {
  return prisma.user.findUnique({
    where: { pubkey },
  })
}

export async function upsertUserByPubkey(pubkey: string) {
  return prisma.user.upsert({
    where: { pubkey },
    create: {
      pubkey,
    },
    update: {},
  })
}

export async function createAuthAuditLog(input: {
  action:
    | "CHALLENGE_ISSUED"
    | "CHALLENGE_REJECTED"
    | "VERIFY_ATTEMPT"
    | "VERIFY_SUCCESS"
    | "VERIFY_FAILURE"
  path: string
  method: string
  resultCode: string
  pubkey?: string
  userId?: string
  detail?: string
  ipHash?: string
  userAgent?: string
  origin?: string
}) {
  return prisma.authAuditLog.create({
    data: input,
  })
}
