import "server-only";

import { prisma } from "@/lib/services/prisma";

export const terminateSession = async (sessionId: string): Promise<void> => {
  await prisma.session.delete({
    where: { id: sessionId },
  });
};
