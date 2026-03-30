"use server";

import assert from "node:assert";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { fetchTicketStatsForEvents } from "@/domain/ticket/actions/fetchTicketStatsAction";
import { isEventCompleted } from "@/domain/event/businessLogic";
import type { Event } from "@/domain/event/types/event";
import type { TicketStats } from "@/domain/ticket/actions/fetchTicketStatsAction";
import {
  DEFAULT_PAGE_SIZE,
  calculatePagination,
} from "@/lib/types/pagination";

export interface SerializedEventForAdmin {
  id: string;
  uid: string;
  name: string;
  date_start: string | null;
  coverImage: {
    src: string;
    alt: string;
    placeholder?: string;
  } | null;
  venue: {
    name: string;
  } | null;
  isCompleted: boolean;
}

export interface PaginatedEventsForAdmin {
  events: SerializedEventForAdmin[];
  ticketStats: Record<string, TicketStats>;
  totalCount: number;
  totalRevenue: number;
  totalSold: number;
  activeCount: number;
  completedCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface FetchEventsParams {
  page?: number;
  pageSize?: number;
}

function serializeEvent(event: Event): SerializedEventForAdmin {
  return {
    id: event.id,
    uid: event.uid,
    name: event.name,
    date_start: event.date_start?.toISOString() ?? null,
    coverImage: event.coverImage
      ? {
          src: event.coverImage.src,
          alt: event.coverImage.alt ?? "",
          placeholder: event.coverImage.placeholder,
        }
      : null,
    venue: event.venue
      ? {
          name: event.venue.name,
        }
      : null,
    isCompleted: isEventCompleted(event),
  };
}

export async function fetchEventsForAdmin(
  params: FetchEventsParams = {}
): Promise<PaginatedEventsForAdmin> {
  const { page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;

  const user = await getCurrentUser();
  assert(user, "User not authenticated");
  assert(
    user.permissions.includes(PERMISSIONS.TICKETS_READ_ALL),
    "User not authorized to read events"
  );

  // Fetch all events from CMS
  const events = await fetchEventsFromCms({});

  // Sort events by date descending (newest first)
  const sortedEvents = [...(events ?? [])].sort((a, b) => {
    if (!a.date_start && !b.date_start) return 0;
    if (!a.date_start) return 1;
    if (!b.date_start) return -1;
    return new Date(b.date_start).getTime() - new Date(a.date_start).getTime();
  });

  // Get all event IDs for ticket stats
  const allEventIds = sortedEvents.map(e => e.id);
  const allTicketStats = await fetchTicketStatsForEvents(allEventIds);

  // Calculate totals from all events
  const totalRevenue = Object.values(allTicketStats).reduce(
    (sum, stats) => sum + stats.revenue,
    0
  );
  const totalSold = Object.values(allTicketStats).reduce(
    (sum, stats) => sum + stats.sold,
    0
  );
  const activeCount = sortedEvents.filter(event => !isEventCompleted(event)).length;
  const completedCount = sortedEvents.length - activeCount;

  // Apply pagination
  const totalCount = sortedEvents.length;
  const pagination = calculatePagination(totalCount, page, pageSize);
  const paginatedEvents = sortedEvents.slice(
    pagination.skip,
    pagination.skip + pagination.take
  );

  // Get ticket stats only for paginated events
  const paginatedEventIds = paginatedEvents.map(e => e.id);
  const paginatedTicketStats: Record<string, TicketStats> = {};
  for (const eventId of paginatedEventIds) {
    if (allTicketStats[eventId]) {
      paginatedTicketStats[eventId] = allTicketStats[eventId];
    }
  }

  return {
    events: paginatedEvents.map(serializeEvent),
    ticketStats: paginatedTicketStats,
    totalCount,
    totalRevenue,
    totalSold,
    activeCount,
    completedCount,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
  };
}
