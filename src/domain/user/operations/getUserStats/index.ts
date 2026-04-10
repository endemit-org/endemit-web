import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import { CacheTags } from "@/lib/services/cache";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

const getUserStatsUncached = async (): Promise<UserStats> => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [totalUsers, activeUsers, newUsersThisMonth] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    newUsersThisMonth,
  };
};

/**
 * Get user statistics (cached)
 */
export const getUserStats = (): Promise<UserStats> => {
  return unstable_cache(getUserStatsUncached, ["admin-user-stats"], {
    tags: [CacheTags.admin.users.stats()],
  })();
};
