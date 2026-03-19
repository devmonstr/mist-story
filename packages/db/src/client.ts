import { PrismaClient } from "@prisma/client"

declare global {
  var __mistPrisma__: PrismaClient | undefined
}

export const prisma =
  globalThis.__mistPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") {
  globalThis.__mistPrisma__ = prisma
}
