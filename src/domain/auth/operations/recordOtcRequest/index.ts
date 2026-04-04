import "server-only";

import { prisma } from "@/lib/services/prisma";

export const recordOtcRequest = async (email: string): Promise<void> => {
  await prisma.otcRateLimit.create({
    data: {
      email: email.toLowerCase(),
    },
  });
};
