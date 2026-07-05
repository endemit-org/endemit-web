import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Returns the stored locale for a user identified by email, defaulting to "sl"
 * when the user or their locale is unknown. Used by account-scoped transactional
 * emails to render in the recipient's preferred language.
 */
export const getUserLocaleByEmail = async (
  email: string
): Promise<"sl" | "en"> => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { locale: true },
  });
  return user?.locale === "en" ? "en" : "sl";
};
