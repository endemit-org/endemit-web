import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface RoleStats {
  totalRoles: number;
  systemRoles: number;
  usersWithRoles: number;
}

const getRoleStatsUncached = async (): Promise<RoleStats> => {
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

/**
 * Get role statistics (cached)
 */
export const getRoleStats = (): Promise<RoleStats> => {
  return unstable_cache(getRoleStatsUncached, ["admin-role-stats"], {
    tags: [CacheTags.admin.roles.stats()],
  })();
};
