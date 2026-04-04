"use server";

import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";

export interface UserSearchResult {
  id: string;
  email: string | null;
  name: string | null;
  username: string;
}

const searchUsersInDb = async (query: string): Promise<UserSearchResult[]> => {
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

const getCachedSearchUsers = unstable_cache(
  searchUsersInDb,
  ["search-users"],
  { revalidate: 60 } // Cache for 60 seconds
);

export async function searchUsersAction(
  query: string
): Promise<{ success: true; users: UserSearchResult[] } | { success: false; error: string }> {
  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  if (!user.permissions.includes(PERMISSIONS.TICKETS_CREATE)) {
    return { success: false, error: "Not authorized" };
  }

  try {
    const users = await getCachedSearchUsers(query.toLowerCase().trim());
    return { success: true, users };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: "Failed to search users" };
  }
}
