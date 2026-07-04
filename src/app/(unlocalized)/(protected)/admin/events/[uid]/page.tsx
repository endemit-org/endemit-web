import {
  fetchEventFromCmsByUid,
  fetchEventFromCmsById,
} from "@/domain/cms/operations/fetchEventFromCms";
import { notFound, redirect } from "next/navigation";
import { getTicketsForEvent } from "@/domain/ticket/operations/getTicketsForEvent";
import { formatEventDateAndTime } from "@/lib/util/formatting";
import ImageWithFallback from "@/app/_components/content/ImageWithFallback";
import EventTicketsDisplay from "@/app/_components/admin/EventTicketsDisplay";
import { serializeTicket } from "@/domain/ticket/util";
import Link from "next/link";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { isEventCompleted } from "@/domain/event/businessLogic";

export const revalidate = 60;

async function getEvent(uidOrId: string) {
  // Try by uid first, then by id
  const eventByUid = await fetchEventFromCmsByUid(uidOrId);
  if (eventByUid) return eventByUid;
  return await fetchEventFromCmsById(uidOrId);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  const event = await getEvent(uid);

  if (!event) {
    notFound();
  }

  return {
    title: `${event.name}  •  Events  •  Admin`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminEventPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const user = await getCurrentUser();

  // Permission check - must have EVENTS_READ to view this page
  if (!user?.permissions.includes(PERMISSIONS.EVENTS_READ)) {
    redirect("/admin");
  }

  const { uid } = await params;
  const event = await getEvent(uid);

  if (!event) {
    notFound();
  }

  const initialTickets = await getTicketsForEvent(event.id);

  const serializedTickets = initialTickets.map(ticket =>
    serializeTicket(ticket)
  );

  const canCreateTickets =
    user.permissions.includes(PERMISSIONS.TICKETS_CREATE) && !isEventCompleted(event);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/events"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Events
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex gap-6 items-start">
          <ImageWithFallback
            src={event.coverImage?.src}
            alt={event.coverImage?.alt ?? ""}
            placeholder={event.coverImage?.placeholder}
            width={200}
            height={200}
            className="aspect-square object-cover rounded-lg w-32 h-32"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            {event.date_start && (
              <p className="text-gray-600 mt-1">
                {formatEventDateAndTime(event.date_start)}
              </p>
            )}
            {event.venue && (
              <p className="text-gray-500">{event.venue.name}</p>
            )}
            {event.artists.length > 0 && (
              <p className="text-gray-400 text-sm mt-2 uppercase">
                {event.artists.map(a => a.name).join(" • ")}
              </p>
            )}
          </div>
        </div>
      </div>

      <EventTicketsDisplay
        eventId={event.id}
        eventName={event.name}
        initialTickets={serializedTickets}
        shouldAutoRefresh={true}
        refreshInterval={30}
        canCreateTickets={canCreateTickets}
      />
    </div>
  );
}
