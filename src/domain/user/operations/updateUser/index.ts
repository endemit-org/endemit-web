import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { UpdateUserInput, SerializedUser } from "@/domain/user/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";
import { bustOnUserUpdated } from "@/lib/services/cache";

export const updateUser = async (
  userId: string,
  data: UpdateUserInput
): Promise<SerializedUser> => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.image !== undefined && { image: data.image }),
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  await bustOnUserUpdated(userId);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: user.name,
    status: user.status,
    signInType: user.signInType,
    image: user.image,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    roles: user.userRoles.map(ur => ur.role.slug as RoleSlug),
  };
};
