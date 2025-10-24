import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { fetchTicketForEventFromCms } from "@/domain/cms/operations/fetchTicketForEventFromCms";

export const fetchEventsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const events = await prismicClient.getAllByType("event", {
    pageSize,
    ...(filters && { filters }),
  });

  if (!events) {
    return null;
  }

  return Promise.all(
    events.map(async event => {
      const ticketsForEvent = await fetchTicketForEventFromCms(event.id);

      return transformEventObject(
        event,
        ticketsForEvent && ticketsForEvent?.length > 0
          ? ticketsForEvent[0].id
          : null
      );
    })
  );
};
