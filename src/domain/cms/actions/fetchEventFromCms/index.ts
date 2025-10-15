import { prismicClient } from "@/services/prismic";
import { PrismicEventDocument } from "@/types/prismic";
import { getFormattedEvent } from "@/domain/event/actions";

export const fetchEventFromCms = async (eventId: string) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId)
    .catch(() => null)) as PrismicEventDocument;

  const eventWithLocalType = getFormattedEvent(prismicEvent);

  return eventWithLocalType;
};
