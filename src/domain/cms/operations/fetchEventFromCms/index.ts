import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { EventDocument } from "@/prismicio-types";
import { fetchTicketForEventFromCms } from "@/domain/cms/operations/fetchTicketForEventFromCms";

export const fetchEventFromCmsByUid = async (eventUid: string) => {
  const prismicEvent = await prismicClient
    .getByUID("event", eventUid)
    .catch(() => null);

  if (!prismicEvent) {
    return null;
  }

  const ticketsForEvent = await fetchTicketForEventFromCms(prismicEvent.id);

  return transformEventObject(
    prismicEvent,
    ticketsForEvent && ticketsForEvent?.length > 0
      ? ticketsForEvent[0].id
      : null
  );
};

export const fetchEventFromCmsById = async (eventId: string) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId)
    .catch(() => null)) as EventDocument;

  if (!prismicEvent) {
    return null;
  }

  const ticketsForEvent = await fetchTicketForEventFromCms(prismicEvent.id);

  return transformEventObject(
    prismicEvent,
    ticketsForEvent && ticketsForEvent?.length > 0
      ? ticketsForEvent[0].id
      : null
  );
};
