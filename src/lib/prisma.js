import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });
}

const prisma = globalForPrisma.prisma;

export default prisma;
