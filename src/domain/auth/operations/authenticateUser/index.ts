import "server-only";

import type { LoginCredentials } from "@/domain/auth/types";
import { prisma } from "@/lib/services/prisma";
import { isPasswordValid, isUserActive } from "@/domain/auth/businessLogic";
import { getLocale } from "next-intl/server";

/** Best-effort current locale; returns undefined outside a request scope. */
async function resolveLocale(): Promise<string | undefined> {
  try {
    const locale = await getLocale();
    return locale === "en" ? "en" : "sl";
  } catch {
    return undefined;
  }
}

export const authenticateUser = async (credentials: LoginCredentials) => {
  const user = await prisma.user.findUnique({
    where: { username: credentials.username },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  if (!isUserActive(user.status)) {
    return null;
  }

  const isValid = await isPasswordValid(
    credentials.password,
    user.passwordHash
  );

  if (!isValid) {
    return null;
  }

  const locale = await resolveLocale();
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), ...(locale ? { locale } : {}) },
  });

  return user;
};
