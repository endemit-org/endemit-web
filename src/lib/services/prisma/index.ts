import { PrismaClient } from "@prisma/client";
import { PUBLIC_CURRENT_ENV } from "@/lib/services/env/public";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (PUBLIC_CURRENT_ENV !== "production") globalForPrisma.prisma = prisma;
