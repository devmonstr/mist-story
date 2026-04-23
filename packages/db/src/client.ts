import { PrismaClient } from "@prisma/client"

declare global {
  var __mythPrisma__: PrismaClient | undefined
}

export const prisma =
  globalThis.__mythPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__mythPrisma__ = prisma
}
