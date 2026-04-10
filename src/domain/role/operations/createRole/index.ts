import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { CreateRoleInput, SerializedRole } from "@/domain/role/types";
import type { Permission } from "@/domain/auth/config/permissions.config";
import { bustOnRoleChanged } from "@/lib/services/cache";

export const createRole = async (input: CreateRoleInput): Promise<SerializedRole> => {
  const role = await prisma.role.create({
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      permissions: input.permissions,
      isSystem: false,
    },
    include: {
      _count: {
        select: {
          userRoles: true,
        },
      },
    },
  });

  await bustOnRoleChanged(role.id);

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
