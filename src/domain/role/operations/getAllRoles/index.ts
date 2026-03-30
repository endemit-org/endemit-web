import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { SerializedRole } from "@/domain/role/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const getAllRoles = async (): Promise<SerializedRole[]> => {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  });

  return roles.map(role => ({
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions as Permission[],
    isSystem: role.isSystem,
    userCount: role._count.userRoles,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  }));
};
