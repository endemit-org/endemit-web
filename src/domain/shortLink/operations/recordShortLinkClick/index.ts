import "server-only";

import { prisma } from "@/lib/services/prisma";

/**
 * Counts one scan or click.
 *
 * Never throws: a failed counter must not stop the redirect, which is the
 * only thing the visitor actually cares about.
 */
export const recordShortLinkClick = async (id: string): Promise<void> => {
  try {
    await prisma.shortLink.update({
      where: { id },
      data: {
        clickCount: { increment: 1 },
        lastClickAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to record short link click", { id, error });
  }
};
