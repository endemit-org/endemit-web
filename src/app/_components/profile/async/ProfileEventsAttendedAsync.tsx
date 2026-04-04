import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { prismicClient } from "@/lib/services/prismic";
import { getBlurDataURL } from "@/lib/util/util";
import type { EventDocument } from "@/prismicio-types";
import ProfileEventsAttended from "@/app/_components/profile/ProfileEventsAttended";

interface ProfileEventsAttendedAsyncProps {
  userId: string;
}

export default async function ProfileEventsAttendedAsync({
  userId,
}: ProfileEventsAttendedAsyncProps) {
  const [pastTickets, allEvents] = await Promise.all([
    getTicketsByUserId(userId, { pastOnly: true }),
    fetchEventsFromCms({}),
  ]);

  if (pastTickets.length === 0) {
    return null;
  }

  // Get unique past event IDs
  const pastEventIds = [...new Set(pastTickets.map(t => t.eventId))];

  // Fetch event data from CMS
  const eventsFromCms = await prismicClient
    .getByIDs<EventDocument>(pastEventIds)
    .catch(() => ({ results: [] }));

  // Build event data with images
  const pastEvents = await Promise.all(
    eventsFromCms.results.map(async event => ({
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

  // Extract unique artists from past events
  const pastEventsWithArtists = allEvents
    ? allEvents.filter(event => pastEventIds.includes(event.id))
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

  return (
    <ProfileEventsAttended
      events={pastEvents}
      artistNames={sortedArtistNames}
    />
  );
}
