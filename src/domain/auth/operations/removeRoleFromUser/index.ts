import "server-only";

import { prisma } from "@/lib/services/prisma";

export const removeRoleFromUser = async (
  userId: string,
  roleSlug: string
) => {
  const role = await prisma.role.findUnique({
    where: { slug: roleSlug },
  });

  if (!role) {
    throw new Error(`Role not found: ${roleSlug}`);
  }

  await prisma.userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });
};
