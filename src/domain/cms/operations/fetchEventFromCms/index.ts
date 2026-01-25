import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { EventDocument } from "@/prismicio-types";
import { fetchTicketsForEventFromCms } from "../fetchTicketsForEventFromCms";
import {
  isProductSellable,
  isProductSoldOut,
} from "@/domain/product/businessLogic";

const getTicketProductIdsForEvent = async (eventId: string): Promise<string[]> => {
  const ticketsForEvent = await fetchTicketsForEventFromCms(eventId);
  const validTicketsForEvent = ticketsForEvent?.filter(
    ticket => isProductSellable(ticket).isSellable
  );
  let ticketProducts = validTicketsForEvent;

  // If all tickets are sold out, return the sold out tickets
  if (validTicketsForEvent?.length === 0) {
    const soldOutTicketProducts = ticketsForEvent?.filter(ticket =>
      isProductSoldOut(ticket)
    );
    if (soldOutTicketProducts?.length === ticketsForEvent?.length) {
      ticketProducts = soldOutTicketProducts;
    }
  }

  // Return all product IDs instead of just the first one
  return ticketProducts?.map(ticket => ticket.id) ?? [];
};

export const fetchEventFromCmsByUid = async (eventUid: string) => {
  const prismicEvent = await prismicClient
    .getByUID("event", eventUid)
    .catch(() => null);

  if (!prismicEvent) {
    return null;
  }
  const ticketProductIds = await getTicketProductIdsForEvent(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductIds);
};

export const fetchEventFromCmsById = async (eventId: string) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId)
    .catch(() => null)) as EventDocument;

  if (!prismicEvent) {
    return null;
  }
  const ticketProductIds = await getTicketProductIdsForEvent(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductIds);
};
