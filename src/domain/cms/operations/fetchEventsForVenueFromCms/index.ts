import "server-only";

import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";

export const fetchEventsForVenueFromCms = async (venueId: string) => {
  const events = await fetchEventsFromCms({});

  if (!events) {
    return null;
  }

  return events.filter(event => event.venue && event.venue.id === venueId);
};
