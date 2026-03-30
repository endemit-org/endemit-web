import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface RoleStats {
  totalRoles: number;
  systemRoles: number;
  usersWithRoles: number;
}

export const getRoleStats = async (): Promise<RoleStats> => {
  const [totalRoles, systemRoles, usersWithRoles] = await Promise.all([
    prisma.role.count(),
    prisma.role.count({ where: { isSystem: true } }),
    prisma.userRole.groupBy({
      by: ["userId"],
    }).then(groups => groups.length),
  ]);

  return {
    totalRoles,
    systemRoles,
    usersWithRoles,
  };
};
