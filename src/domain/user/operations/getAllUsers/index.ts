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
}

const getAllUsersUncached = async ({
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: GetAllUsersParams = {}): Promise<PaginatedUsers> => {
  const totalCount = await prisma.user.count();
  const pagination = calculatePagination(totalCount, page, pageSize);

  const users = await prisma.user.findMany({
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
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  return unstable_cache(
    () => getAllUsersUncached(params),
    ["admin-users", String(page), String(pageSize)],
    { tags: [CacheTags.admin.users.list()] }
  )();
};
