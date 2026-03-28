import type { Metadata } from "next";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { fetchTicketStatsForEvents } from "@/domain/ticket/actions/fetchTicketStatsAction";
import EventsList from "@/app/_components/admin/EventsList";

export const metadata: Metadata = {
  title: "Events  •  Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminEventsPage() {
  const events = await fetchEventsFromCms({});

  // Sort events by date descending (newest first)
  const sortedEvents = [...(events ?? [])].sort((a, b) => {
    if (!a.date_start && !b.date_start) return 0;
    if (!a.date_start) return 1;
    if (!b.date_start) return -1;
    return new Date(b.date_start).getTime() - new Date(a.date_start).getTime();
  });

  const eventIds = sortedEvents.map(e => e.id);
  const ticketStats = await fetchTicketStatsForEvents(eventIds);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage event tickets
        </p>
      </div>
      <EventsList events={sortedEvents} ticketStats={ticketStats} />
    </div>
  );
}
