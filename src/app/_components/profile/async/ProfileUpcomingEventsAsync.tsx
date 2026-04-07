import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted, isEventVisible } from "@/domain/event/businessLogic";
import ProfileUpcomingEventsPromo from "@/app/_components/profile/ProfileUpcomingEventsPromo";

interface ProfileUpcomingEventsAsyncProps {
  userId: string;
}

export default async function ProfileUpcomingEventsAsync({
  userId,
}: ProfileUpcomingEventsAsyncProps) {
  const [upcomingTickets, allEvents] = await Promise.all([
    getTicketsByUserId(userId, { upcomingOnly: true }),
    fetchEventsFromCms({}),
  ]);

  if (!allEvents) {
    return null;
  }

  // Get events user already has tickets for
  const userTicketEventIds = new Set(upcomingTickets.map(t => t.eventId));

  // Filter to upcoming visible events user doesn't have tickets for
  const upcomingEventsForPromo = allEvents
    .filter(event => isEventVisible(event))
    .filter(event => !isEventCompleted(event))
    .filter(event => event.date_start !== null)
    .filter(event => !userTicketEventIds.has(event.id))
    .sort(
      (a, b) =>
        (a.date_start?.getTime() ?? 0) - (b.date_start?.getTime() ?? 0)
    )
    .slice(0, 3)
    .map(event => ({
      id: event.id,
      uid: event.uid,
      name: event.name,
      dateStart: event.date_start,
      dateEnd: event.date_end,
      image: event.promoImage,
      link: `/events/${event.uid}`,
      hasTicketsAvailable: event.tickets.productIds.length > 0,
    }));

  if (upcomingEventsForPromo.length === 0) {
    return null;
  }

  return <ProfileUpcomingEventsPromo events={upcomingEventsForPromo} />;
}
