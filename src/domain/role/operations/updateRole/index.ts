import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { UpdateRoleInput, SerializedRole } from "@/domain/role/types";
import type { Permission } from "@/domain/auth/config/permissions.config";

export const updateRole = async (
  id: string,
  input: UpdateRoleInput
): Promise<SerializedRole> => {
  const role = await prisma.role.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.slug !== undefined && { slug: input.slug }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.permissions !== undefined && { permissions: input.permissions }),
    },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  });

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
