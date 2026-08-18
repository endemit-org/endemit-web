"use server";

import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import {
  PERMISSIONS,
  type Permission,
} from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";

export interface UserSearchResult {
  id: string;
  email: string | null;
  name: string | null;
  username: string;
}

const searchUsersInDb = async (
  query: string,
  requirePermission?: Permission
): Promise<UserSearchResult[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
      ],
      status: "ACTIVE",
      // Optionally only users whose roles grant a specific permission
      ...(requirePermission && {
        userRoles: {
          some: { role: { permissions: { has: requirePermission } } },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
    },
    take: 10,
    orderBy: [{ name: "asc" }, { email: "asc" }],
  });

  return users;
};

// unstable_cache keys on the serialized arguments, so permission-filtered
// searches cache separately from unfiltered ones.
const getCachedSearchUsers = unstable_cache(
  searchUsersInDb,
  ["search-users"],
  { revalidate: 60 } // Cache for 60 seconds
);

export async function searchUsersAction(
  query: string,
  options?: { requirePermission?: Permission }
): Promise<{ success: true; users: UserSearchResult[] } | { success: false; error: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (
    !user.permissions.includes(PERMISSIONS.TICKETS_CREATE) &&
    !user.permissions.includes(PERMISSIONS.EVENT_CLAIMS_MANAGE) &&
    !user.permissions.includes(PERMISSIONS.POS_STICKERS_MANAGE) &&
    !user.permissions.includes(PERMISSIONS.POS_REGISTERS_WRITE) &&
    !user.permissions.includes(PERMISSIONS.WALLETS_MANAGE_BALANCE)
  ) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const users = await getCachedSearchUsers(
      query.toLowerCase().trim(),
      options?.requirePermission
    );
    return { success: true, users };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
  }
}
