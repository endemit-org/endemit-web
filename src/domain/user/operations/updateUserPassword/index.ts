import "server-only";

import { prisma } from "@/lib/services/prisma";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";

export const updateUserPassword = async (
  userId: string,
  newPassword: string
): Promise<void> => {
  const passwordHash = await createPasswordHash(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};
