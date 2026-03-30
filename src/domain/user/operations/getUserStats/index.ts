import "server-only";

import { prisma } from "@/lib/services/prisma";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

export const getUserStats = async (): Promise<UserStats> => {
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
