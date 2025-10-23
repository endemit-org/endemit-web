import "server-only";

import { prisma } from "@/lib/services/prisma";

export const deleteSession = async (sessionToken: string) => {
  await prisma.session.delete({
    where: { sessionToken },
  });
};
