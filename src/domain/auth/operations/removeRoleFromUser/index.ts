import "server-only";

import type { RoleSlug } from "@/domain/auth/config/roles.config";
import { prisma } from "@/lib/services/prisma";

export const removeRoleFromUser = async (
  userId: string,
  roleSlug: RoleSlug
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
