import "server-only";

import { prisma } from "@/lib/services/prisma";
import { bustOnRoleAssigned } from "@/lib/services/cache";

export const assignRoleToUser = async (
  userId: string,
  roleSlug: string,
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

  await bustOnRoleAssigned(userId);

  return userRole;
};
