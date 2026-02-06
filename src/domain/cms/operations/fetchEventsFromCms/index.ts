import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { fetchTicketsForEventFromCms } from "../fetchTicketsForEventFromCms";
import { isProductSellable } from "@/domain/product/businessLogic";

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
      const ticketsForEvent = await fetchTicketsForEventFromCms(event.id);
      // Return all sellable product IDs
      const ticketProductIds =
        ticketsForEvent
          ?.filter(ticket => isProductSellable(ticket).isSellable)
          .map(ticket => ticket.id) ?? [];

      return await transformEventObject(event, ticketProductIds);
    })
  );
};
