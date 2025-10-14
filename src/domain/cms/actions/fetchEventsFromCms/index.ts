import { prismicClient } from "@/services/prismic";
import { PrismicEventDocument } from "@/types/prismic";
import { getFormattedEvent } from "@/domain/event/actions";

export const fetchEventsFromCms = async ({
  pageSize = 200,
  filters,
}: {
  pageSize?: number;
  filters?: string[];
}) => {
  const events = (await prismicClient.getAllByType("event", {
    pageSize,
    ...(filters && { filters }),
  })) as PrismicEventDocument[];

  const eventsWithLocalType = events.map(event => getFormattedEvent(event));

  return eventsWithLocalType;
};
