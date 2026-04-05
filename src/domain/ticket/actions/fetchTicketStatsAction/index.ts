"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import { TicketStatus } from "@prisma/client";

export interface TicketStats {
  eventId: string;
  total: number;
  sold: number;
  scanned: number;
  pending: number;
  validated: number;
  cancelled: number;
  refunded: number;
  revenue: number;
  guestList: number;
}

export async function fetchTicketStatsForEvent(
  eventId: string
): Promise<TicketStats> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read tickets"
  );

  return fetchTicketStatsForEventInternal(eventId);
}

export async function fetchTicketStatsForEvents(
  eventIds: string[]
): Promise<Record<string, TicketStats>> {
  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read tickets"
  );

  const stats = await Promise.all(
    eventIds.map(eventId => fetchTicketStatsForEventInternal(eventId))
  );

  return stats.reduce(
    (acc, stat) => {
      acc[stat.eventId] = stat;
      return acc;
    },
    {} as Record<string, TicketStats>
  );
}

async function fetchTicketStatsForEventInternal(
  eventId: string
): Promise<TicketStats> {
  const [total, sold, scanned, pending, validated, cancelled, refunded, revenueResult, guestList] =
    await Promise.all([
      // Total includes all tickets (guest + sold) except refunded
      prisma.ticket.count({
        where: { eventId, status: { not: TicketStatus.REFUNDED } }
      }),
      // Sold excludes guest list tickets and refunded tickets
      prisma.ticket.count({
        where: { eventId, isGuestList: false, status: { not: TicketStatus.REFUNDED } }
      }),
      prisma.ticket.count({
        where: { eventId, status: TicketStatus.SCANNED },
      }),
      prisma.ticket.count({
        where: { eventId, status: TicketStatus.PENDING },
      }),
      prisma.ticket.count({
        where: { eventId, status: TicketStatus.VALIDATED },
      }),
      prisma.ticket.count({
        where: { eventId, status: TicketStatus.CANCELLED },
      }),
      prisma.ticket.count({
        where: { eventId, status: TicketStatus.REFUNDED },
      }),
      // Revenue only from sold tickets (not guest list, not refunded)
      prisma.ticket.aggregate({
        where: { eventId, isGuestList: false, status: { not: TicketStatus.REFUNDED } },
        _sum: {
          price: true,
        },
      }),
      prisma.ticket.count({
        where: { eventId, isGuestList: true },
      }),
    ]);

  return {
    eventId,
    total,
    sold,
    scanned,
    pending,
    validated,
    cancelled,
    refunded,
    revenue: Number(revenueResult._sum.price ?? 0),
    guestList,
  };
}
