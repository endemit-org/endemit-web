import "server-only";

import { prisma } from "@/lib/services/prisma";
import { CreateEventClaimData } from "@/domain/claim/types";

export const createEventClaim = async (data: CreateEventClaimData) => {
  const existing = await prisma.eventClaim.findUnique({
    where: {
      userId_eventId: {
        userId: data.userId,
        eventId: data.eventId,
      },
    },
  });

  if (existing) {
    throw new Error("You have already claimed this event");
  }

  return await prisma.eventClaim.create({
    data: {
      userId: data.userId,
      eventId: data.eventId,
      eventName: data.eventName,
      status: "PENDING",
    },
  });
};
