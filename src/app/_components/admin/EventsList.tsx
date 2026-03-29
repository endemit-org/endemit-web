"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import Pagination from "@/app/_components/table/Pagination";
import { formatEventDateAndTime, formatPrice } from "@/lib/util/formatting";
import {
  fetchEventsForAdmin,
  type PaginatedEventsForAdmin,
  type SerializedEventForAdmin,
} from "@/domain/event/actions/fetchEventsForAdminAction";
import type { TicketStats } from "@/domain/ticket/actions/fetchTicketStatsAction";

interface EventsListProps {
  initialData: PaginatedEventsForAdmin;
}

export default function EventsList({ initialData }: EventsListProps) {
  const [events, setEvents] = useState<SerializedEventForAdmin[]>(initialData.events);
  const [ticketStats, setTicketStats] = useState<Record<string, TicketStats>>(initialData.ticketStats);
  const [currentPage, setCurrentPage] = useState(initialData.page);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [totalCount, setTotalCount] = useState(initialData.totalCount);
  const [totalRevenue, setTotalRevenue] = useState(initialData.totalRevenue);
  const [totalSold, setTotalSold] = useState(initialData.totalSold);
  const [activeCount, setActiveCount] = useState(initialData.activeCount);
  const [completedCount, setCompletedCount] = useState(initialData.completedCount);
  const [isLoading, setIsLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    try {
      const data = await fetchEventsForAdmin({ page });
      setEvents(data.events);
      setTicketStats(data.ticketStats);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
      setTotalRevenue(data.totalRevenue);
      setTotalSold(data.totalSold);
      setActiveCount(data.activeCount);
      setCompletedCount(data.completedCount);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePageChange = (page: number) => {
    loadPage(page);
  };

  const handleRefresh = () => {
    loadPage(currentPage);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="text-sm text-gray-600">
            Revenue:{" "}
            <strong className="text-green-600 text-lg">
              {formatPrice(totalRevenue)}
            </strong>
          </div>
          <div className="text-sm text-gray-600">
            Sold:{" "}
            <strong className="text-gray-900 text-lg">{totalSold}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Events: <strong className="text-gray-900">{totalCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Active: <strong className="text-green-600">{activeCount}</strong>
          </div>
          <div className="text-sm text-gray-600">
            Completed: <strong className="text-gray-500">{completedCount}</strong>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {events.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {events.map(event => {
              const stats = ticketStats[event.id];

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
                              {formatEventDateAndTime(new Date(event.date_start))}
                            </p>
                          )}
                          {event.venue && (
                            <p className="text-sm text-gray-400 truncate">
                              {event.venue.name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {event.isCompleted ? (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              Past Event
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                              Upcoming
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        isLoading={isLoading}
      />
    </div>
  );
}
