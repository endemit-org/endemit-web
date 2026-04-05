"use server";

import { prisma } from "@/lib/services/prisma";

interface CheckAuthModeParams {
  identifier: string;
}

interface CheckAuthModeResult {
  exists: boolean;
  authMode: "OTC" | "PASSWORD" | null;
  email?: string;
  username?: string;
}

export const checkAuthMode = async ({
  identifier,
}: CheckAuthModeParams): Promise<CheckAuthModeResult> => {
  const normalizedIdentifier = identifier.trim();
  const isUsername = normalizedIdentifier.startsWith("@");

  let user;

  if (isUsername) {
    // Look up by username - keep the @ prefix as that's how usernames are stored
    user = await prisma.user.findUnique({
      where: { username: normalizedIdentifier },
      select: {
        signInType: true,
        email: true,
        username: true,
        status: true,
      },
    });
  } else {
    // Look up by email
    const email = normalizedIdentifier.toLowerCase();
    user = await prisma.user.findUnique({
      where: { email },
      select: {
        signInType: true,
        email: true,
        username: true,
        status: true,
      },
    });
  }

  if (!user) {
    return {
      exists: false,
      authMode: null,
    };
  }

  // Check if user can sign in
  if (user.status !== "ACTIVE" && user.status !== "PENDING_VERIFICATION") {
    return {
      exists: true,
      authMode: null, // Account exists but can't sign in
      email: user.email ?? undefined,
      username: user.username,
    };
  }

  return {
    exists: true,
    authMode: user.signInType as "OTC" | "PASSWORD",
    email: user.email ?? undefined,
    username: user.username,
  };
};
