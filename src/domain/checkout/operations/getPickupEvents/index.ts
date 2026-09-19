import "server-only";

import { fetchEventsFromCms } from "@/domain/cms/operations/fetchEventsFromCms";
import { isEventCompleted, isEventVisible } from "@/domain/event/businessLogic";
import { PickupEvent } from "@/domain/checkout/types/checkout";

const PICKUP_WINDOW_DAYS = 90;

/**
 * Upcoming visible events (next 90 days) a customer can collect a pickup
 * order at. Empty list means only "po dogovoru" is offered.
 */
export const getPickupEvents = async (): Promise<PickupEvent[]> => {
  const events = await fetchEventsFromCms({});
  if (!events) return [];

  const now = Date.now();
  const horizon = now + PICKUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  return events
    .filter(event => isEventVisible(event))
    .filter(event => !isEventCompleted(event))
    .filter(
      event =>
        event.date_start !== null &&
        event.date_start.getTime() >= now &&
        event.date_start.getTime() <= horizon
    )
    .sort(
      (a, b) =>
        (a.date_start?.getTime() ?? 0) - (b.date_start?.getTime() ?? 0)
    )
    .map(event => ({
      uid: event.uid,
      name: event.name,
      dateStart: event.date_start!.toISOString(),
      venueName: event.venue?.name ?? null,
    }));
};
