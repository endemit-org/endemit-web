import "server-only";

import type { RegisterData } from "@/domain/auth/types";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";
import { prisma } from "@/lib/services/prisma";

export const createUser = async (data: RegisterData) => {
  const passwordHash = await createPasswordHash(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
    },
  });

  return user;
};
