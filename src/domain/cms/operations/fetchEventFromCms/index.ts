import "server-only";

import { prismicClient } from "@/lib/services/prismic";
import { transformEventObject } from "@/domain/event/transformers/transformEventObject";
import { EventDocument } from "@/prismicio-types";
import type { AppLocale } from "@/i18n/routing";
import { fetchTicketsForEventFromCms } from "../fetchTicketsForEventFromCms";
import {
  isProductSellable,
  isProductSoldOut,
} from "@/domain/product/businessLogic";

// Linked venue/artist docs are only embedded field-by-field via fetchLinks. The
// transformer localizes them with `_sl` twins, so those MUST be requested here —
// otherwise only the base (English) fields come back and pickLocalized falls
// back to English on the event's Location tab and lineup bios. Same for both
// locales, so the fetch cache stays shared.
const EVENT_FETCH_LINKS = [
  "venue.name",
  "venue.name_sl",
  "venue.description",
  "venue.description_sl",
  "venue.address",
  "venue.coordinates",
  "venue.image",
  "venue.venue_logo",
  "venue.map_location_url",
  "artist.name",
  "artist.description",
  "artist.description_sl",
  "artist.image",
  "artist.video",
  "artist.is_b2b",
  "artist.b2b_attributed_to_artist",
];

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

export const fetchEventFromCmsByUid = async (
  eventUid: string,
  locale: AppLocale = "sl"
) => {
  // Note: no `lang` param — the query is identical for both locales, so the
  // Next.js fetch cache is shared. Localization happens in the transformer.
  const prismicEvent = await prismicClient
    .getByUID("event", eventUid, { fetchLinks: EVENT_FETCH_LINKS })
    .catch(() => null);

  if (!prismicEvent) {
    return null;
  }
  const ticketProductIds = await getTicketProductIdsForEvent(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductIds, locale);
};

export const fetchEventFromCmsById = async (
  eventId: string,
  locale: AppLocale = "sl"
) => {
  const prismicEvent = (await prismicClient
    .getByID(eventId, { fetchLinks: EVENT_FETCH_LINKS })
    .catch(() => null)) as EventDocument;

  if (!prismicEvent) {
    return null;
  }
  const ticketProductIds = await getTicketProductIdsForEvent(prismicEvent.id);

  return await transformEventObject(prismicEvent, ticketProductIds, locale);
};
