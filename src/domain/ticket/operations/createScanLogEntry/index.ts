import "server-only";

import { prisma } from "@/lib/services/prisma";

export const createScanLogEntry = async ({
  ticketId,
  userId,
  eventId,
}: {
  ticketId: string;
  userId: string;
  eventId: string;
}) => {
  return await prisma.scanLog.create({
    data: {
      ticketId,
      userId,
      eventId,
    },
  });
};
