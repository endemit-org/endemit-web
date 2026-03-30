import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedRole } from "@/domain/role/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const getRoleById = async (id: string): Promise<SerializedRole | null> => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  });

  if (!role) {
    return null;
  }

  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions as Permission[],
    isSystem: role.isSystem,
    userCount: role._count.userRoles,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
};
