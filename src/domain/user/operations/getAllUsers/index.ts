import "server-only";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/services/prisma";
import type { PaginatedUsers, SerializedUser } from "@/domain/user/types";
import type { RoleSlug } from "@/domain/auth/config/roles.config";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";
import { CacheTags } from "@/lib/services/cache";

interface GetAllUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

const getAllUsersUncached = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
  search,
}: GetAllUsersParams = {}): Promise<PaginatedUsers> => {
  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const totalCount = await prisma.user.count({ where });
  const pagination = calculatePagination(totalCount, page, pageSize);

  const users = await prisma.user.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  const serializedUsers: SerializedUser[] = users.map(user => ({
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
  }));

  return {
    users: serializedUsers,
    totalCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
};

/**
 * Get all users (cached)
 */
export const getAllUsers = (
  params: GetAllUsersParams = {}
): Promise<PaginatedUsers> => {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE, search = "" } = params;

  return unstable_cache(
    () => getAllUsersUncached(params),
    ["admin-users", String(page), String(pageSize), search],
    { tags: [CacheTags.admin.users.list()] }
  )();
};
