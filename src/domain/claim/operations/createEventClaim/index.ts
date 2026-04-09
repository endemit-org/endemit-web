import "server-only";

import { prisma } from "@/lib/services/prisma";
import { CreateEventClaimData } from "@/domain/claim/types";
import { bustOnEventClaimed } from "@/lib/services/cache";

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

  const claim = await prisma.eventClaim.create({
    data: {
      userId: data.userId,
      eventId: data.eventId,
      eventName: data.eventName,
      status: "PENDING",
    },
  });

  // Bust claims cache
  await bustOnEventClaimed(data.userId);

  return claim;
};
