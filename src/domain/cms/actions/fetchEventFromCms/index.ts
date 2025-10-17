import { prismicClient } from "@/services/prismic";
import { PrismicEventDocument } from "@/domain/cms/types/prismic";
import { getFormattedEvent } from "@/domain/event/actions";

export const fetchEventFromCmsByUid = async (eventUid: string) => {
  const prismicEvent = (await prismicClient
    .getByUID("event", eventUid)
    .catch(() => null)) as PrismicEventDocument;

  if (!prismicEvent) {
    return null;
  }

  const eventWithLocalType = getFormattedEvent(prismicEvent);

  return eventWithLocalType;
};

export const fetchEventFromCmsById = async (eventId: string) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId)
    .catch(() => null)) as PrismicEventDocument;

  if (!prismicEvent) {
    return null;
  }

  const eventWithLocalType = getFormattedEvent(prismicEvent);

  return eventWithLocalType;
};
