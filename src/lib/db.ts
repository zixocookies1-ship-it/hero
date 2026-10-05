import { PrismaClient } from "@prisma/client";

// Next.js hot-reloads server modules in development, which would otherwise open
// a new connection pool on every edit until the server refuses more connections.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}