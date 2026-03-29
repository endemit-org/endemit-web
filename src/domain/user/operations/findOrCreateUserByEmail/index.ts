import "server-only";

import { prisma } from "@/lib/services/prisma";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";

interface FindOrCreateUserResult {
  user: {
    id: string;
    email: string;
    isNewUser: boolean;
  };
}

export const findOrCreateUserByEmail = async (
  email: string
): Promise<FindOrCreateUserResult> => {
  const normalizedEmail = email.toLowerCase().trim();

  // Try to find existing user
  let user = await prisma.user.findFirst({
    where: { email: normalizedEmail },
    select: { id: true, email: true },
  });

  if (user) {
    return {
      user: {
        id: user.id,
        email: user.email!,
        isNewUser: false,
      },
    };
  }

  // Create new user with OTC sign-in type
  user = await prisma.user.create({
    data: {
      username: normalizedEmail,
      email: normalizedEmail,
      signInType: "OTC",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
    select: { id: true, email: true },
  });

  // Assign the "user" role
  const userRole = await prisma.role.findUnique({
    where: { slug: ROLE_SLUGS.USER },
  });

  if (userRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: userRole.id,
      },
    });
  }

  // Create wallet for new user
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 0,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email!,
      isNewUser: true,
    },
  };
};
