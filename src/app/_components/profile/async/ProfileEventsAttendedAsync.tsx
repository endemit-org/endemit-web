import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { getEventClaimsByUserId } from "@/domain/claim/operations/getEventClaimsByUserId";
import { prismicClient } from "@/lib/services/prismic";
import { getBlurDataURL } from "@/lib/util/util";
import type { EventDocument } from "@/prismicio-types";
import type { Event } from "@/domain/event/types/event";
import ProfileEventsAttended from "@/app/_components/profile/ProfileEventsAttended";

interface ProfileEventsAttendedAsyncProps {
  userId: string;
}

export default async function ProfileEventsAttendedAsync({
  userId,
}: ProfileEventsAttendedAsyncProps) {
  const [pastTickets, allEvents, userClaims] = await Promise.all([
    getTicketsByUserId(userId, { pastOnly: true }),
    fetchEventsFromCms({}),
    getEventClaimsByUserId(userId),
  ]);

  // Get IDs from tickets
  const ticketEventIds = [...new Set(pastTickets.map((t: { eventId: string }) => t.eventId))];

  // Get approved claim event IDs
  const approvedClaims = userClaims.filter((c: { status: string }) => c.status === "APPROVED");
  const approvedClaimEventIds = approvedClaims.map((c: { eventId: string }) => c.eventId);

  // Get pending claims for UI display
  const pendingClaims = userClaims
    .filter((c: { status: string }) => c.status === "PENDING")
    .map((c: { id: string; eventId: string; eventName: string }) => ({
      id: c.id,
      eventId: c.eventId,
      eventName: c.eventName,
    }));

  // Combine ticket + approved claim event IDs
  const allAttendedEventIds = [
    ...new Set([...ticketEventIds, ...approvedClaimEventIds]),
  ];

  // Fetch event data from CMS for attended events
  const eventsFromCms =
    allAttendedEventIds.length > 0
      ? await prismicClient
          .getByIDs<EventDocument>(allAttendedEventIds)
          .catch(() => ({ results: [] }))
      : { results: [] };

  // Build event data with images
  const pastEvents = await Promise.all(
    eventsFromCms.results.map(async (event) => ({
      id: event.id,
      uid: event.uid ?? "",
      name: event.data.title ?? "Event",
      dateStart: event.data.date_start
        ? new Date(event.data.date_start)
        : null,
      dateEnd: event.data.date_end ? new Date(event.data.date_end) : null,
      image: event.data.promo_image?.url
        ? {
            src: event.data.promo_image.url,
            alt: event.data.promo_image.alt,
            placeholder: await getBlurDataURL(event.data.promo_image.url),
          }
        : null,
      link: event.data.enable_link_to_full_page ? `/events/${event.uid}` : "",
    }))
  );

  // Extract unique artists from all attended events
  const pastEventsWithArtists = allEvents
    ? allEvents.filter((event: Event) => allAttendedEventIds.includes(event.id))
    : [];

  const uniqueArtistNames = new Set<string>();
  for (const event of pastEventsWithArtists) {
    for (const artist of event.artists) {
      uniqueArtistNames.add(artist.name.toUpperCase());
    }
  }
  const sortedArtistNames = [...uniqueArtistNames].sort((a, b) =>
    a.localeCompare(b)
  );

  // Build claimable events list (past events user doesn't have tickets or claims for)
  const now = new Date();
  const existingEventIds = new Set([
    ...allAttendedEventIds,
    ...pendingClaims.map((c: { eventId: string }) => c.eventId),
  ]);

  const claimableEvents = allEvents
    ? allEvents
        .filter((event: Event) => {
          // Must be past event
          const eventEnd = event.date_end ?? event.date_start;
          if (!eventEnd || new Date(eventEnd) >= now) return false;
          // Must not already have ticket or claim
          return !existingEventIds.has(event.id);
        })
        .map((event: Event) => ({
          id: event.id,
          name: event.name,
          dateStart: event.date_start,
        }))
        .sort((a: { dateStart: Date | null }, b: { dateStart: Date | null }) => {
          // Sort by date descending (most recent first)
          if (!a.dateStart) return 1;
          if (!b.dateStart) return -1;
          return (
            new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
          );
        })
    : [];

  return (
    <ProfileEventsAttended
      events={pastEvents}
      artistNames={sortedArtistNames}
      pendingClaims={pendingClaims}
      claimableEvents={claimableEvents}
    />
  );
}
