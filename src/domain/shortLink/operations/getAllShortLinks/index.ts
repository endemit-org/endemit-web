import "server-only";

import { prisma } from "@/lib/services/prisma";
import type { ShortLinkRecord } from "@/domain/shortLink/types";

/** All short links, newest first, serialized for the admin client. */
export const getAllShortLinks = async (): Promise<ShortLinkRecord[]> => {
  const links = await prisma.shortLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  return links.map(link => ({
    id: link.id,
    code: link.code,
    targetUrl: link.targetUrl,
    description: link.description,
    isActive: link.isActive,
    clickCount: link.clickCount,
    lastClickAt: link.lastClickAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    updatedAt: link.updatedAt.toISOString(),
  }));
};
