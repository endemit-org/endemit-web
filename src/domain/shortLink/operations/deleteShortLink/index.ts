import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Permanently removes a short link.
 *
 * Anything already printed with this code stops working, which is why the
 * admin UI offers disabling as the reversible alternative.
 */
export const deleteShortLink = async (id: string) => {
  return prisma.shortLink.delete({ where: { id } });
};
