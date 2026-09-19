import "server-only";

import {
  DeliveryMethod,
  PICKUP_BY_AGREEMENT,
  PickupSelection,
} from "@/domain/checkout/types/checkout";
import { getPickupEvents } from "@/domain/checkout/operations/getPickupEvents";

/**
 * Validates the customer's pickup choice against the events currently on
 * offer and returns the snapshot to store on the order. Returns undefined
 * for shipping orders.
 */
export const resolvePickupSelection = async (
  deliveryMethod: DeliveryMethod,
  pickupEventUid: string
): Promise<PickupSelection | undefined> => {
  if (deliveryMethod !== DeliveryMethod.PICKUP) return undefined;

  if (pickupEventUid === PICKUP_BY_AGREEMENT) {
    return { eventUid: null, eventName: null, eventDate: null };
  }

  const event = (await getPickupEvents()).find(
    candidate => candidate.uid === pickupEventUid
  );
  if (!event) {
    throw new Error("Selected pickup event is not available");
  }

  return {
    eventUid: event.uid,
    eventName: event.name,
    eventDate: new Date(event.dateStart),
  };
};
