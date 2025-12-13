import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { EventDocument } from "@/prismicio-types";
import { fetchTicketsForEventFromCms } from "../fetchTicketsForEventFromCms";
import { isProductSellable } from "@/domain/product/businessLogic";

const getTicketProductForEventObject = async (eventId: string) => {
  const ticketsForEvent = await fetchTicketsForEventFromCms(eventId);
  const validTicketsForEvent = ticketsForEvent?.filter(
    ticket => isProductSellable(ticket).isSellable
  );

  const ticketProductId =
    validTicketsForEvent && validTicketsForEvent?.length > 0
      ? validTicketsForEvent[0].id
      : null;

  return ticketProductId;
};

export const fetchEventFromCmsByUid = async (eventUid: string) => {
  const prismicEvent = await prismicClient
    .getByUID("event", eventUid)
    .catch(() => null);

  if (!prismicEvent) {
    return null;
  }
  const ticketProductId = await getTicketProductForEventObject(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductId);
};

export const fetchEventFromCmsById = async (eventId: string) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId)
    .catch(() => null)) as EventDocument;

  if (!prismicEvent) {
    return null;
  }
  const ticketProductId = await getTicketProductForEventObject(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductId);
};
