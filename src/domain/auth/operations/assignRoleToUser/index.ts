import "server-only";

import type { RoleSlug } from "@/domain/auth/config/roles.config";
import { prisma } from "@/lib/services/prisma";

export const assignRoleToUser = async (
  userId: string,
  roleSlug: RoleSlug,
  assignedBy?: string
) => {
  const role = await prisma.role.findUnique({
    where: { slug: roleSlug },
  });

  if (!role) {
    throw new Error(`Role not found: ${roleSlug}`);
  }

  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
  });

  if (existingUserRole) {
    return existingUserRole;
  }

  const userRole = await prisma.userRole.create({
    data: {
      userId,
      roleId: role.id,
      assignedBy,
    },
    include: {
      role: true,
    },
  });

  return userRole;
};
