"use client";

import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import { formatEventDateAndTime, formatPrice } from "@/lib/util/formatting";
import { isEventCompleted } from "@/domain/event/businessLogic";
import type { Event } from "@/domain/event/types/event";
import type { TicketStats } from "@/domain/ticket/actions/fetchTicketStatsAction";

interface EventsListProps {
  events: Event[];
  ticketStats: Record<string, TicketStats>;
}

export default function EventsList({ events, ticketStats }: EventsListProps) {
  const activeCount = events.filter(event => !isEventCompleted(event)).length;
  const completedCount = events.length - activeCount;

  // Calculate total revenue from all events
  const totalRevenue = Object.values(ticketStats).reduce(
    (sum, stats) => sum + stats.revenue,
    0
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Total Revenue:{" "}
            <strong className="text-green-600 text-lg">
              {formatPrice(totalRevenue)}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Events: <strong className="text-gray-900">{events.length}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Active: <strong className="text-green-600">{activeCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Completed: <strong className="text-gray-500">{completedCount}</strong>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {events.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {events.map(event => {
              const stats = ticketStats[event.id];
              const isCompleted = isEventCompleted(event);

              return (
                <Link
                  key={event.id}
                  href={`/admin/events/${event.uid}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <ImageWithFallback
                      src={event.coverImage?.src}
                      alt={event.coverImage?.alt ?? ""}
                      placeholder={event.coverImage?.placeholder}
                      width={80}
                      height={80}
                      className="aspect-square object-cover rounded-lg w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                            {event.name}
                          </h3>
                          {event.date_start && (
                            <p className="text-sm text-gray-500">
                              {formatEventDateAndTime(event.date_start)}
                            </p>
                          )}
                          {event.venue && (
                            <p className="text-sm text-gray-400 truncate">
                              {event.venue.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {isCompleted && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              Done
                            </span>
                          )}
                          <svg
                            className="w-5 h-5 text-gray-400 hidden sm:block"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>

                      {stats && (
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm">
                          <div>
                            <span className="font-bold text-green-600">
                              {formatPrice(stats.revenue)}
                            </span>
                          </div>
                          <div>
                            <span className="font-bold text-gray-900">{stats.sold}</span>
                            <span className="text-gray-500 ml-1">sold</span>
                          </div>
                          {stats.guestList > 0 && (
                            <div>
                              <span className="font-bold text-purple-600">{stats.guestList}</span>
                              <span className="text-gray-500 ml-1">guest</span>
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-green-600">{stats.scanned}</span>
                            <span className="text-gray-500 ml-1">scanned</span>
                          </div>
                          <div>
                            <span className="font-bold text-blue-600">{stats.pending}</span>
                            <span className="text-gray-500 ml-1">pending</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            No events found
          </div>
        )}
      </div>
    </div>
  );
}
