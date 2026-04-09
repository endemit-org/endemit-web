import "server-only";

import type { RegisterData } from "@/domain/auth/types";
import { createPasswordHash } from "@/domain/auth/operations/createPasswordHash";
import { prisma } from "@/lib/services/prisma";
import { bustOnUserCreated, bustOnWalletCreated } from "@/lib/services/cache";

export const createUser = async (data: RegisterData) => {
  const passwordHash = await createPasswordHash(data.password);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      name: data.name,
      passwordHash,
    },
  });

  // Create wallet for new user
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 0,
    },
  });

  // Bust caches for new user
  await bustOnUserCreated();
  await bustOnWalletCreated(user.id);

  return user;
};
