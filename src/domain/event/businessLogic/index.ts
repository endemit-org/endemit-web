import { Event, EventType, EventVisibility } from "@/domain/event/types/event";
import { isDateInPast } from "@/lib/util/util";

export const isEventVisible = (event: Event) => {
  if (process.env.FEAT_IGNORE_VISIBILITY === "true") return true;
  return event.options.visibility !== EventVisibility.Hidden;
};

export const isEventCompleted = (event: Event, bufferHours: number = 0) => {
  if (!event.date_end) {
    return false;
  }

  const endDate = new Date(event.date_end);
  const endWithBuffer = new Date(endDate.getTime() + bufferHours * 60 * 60 * 1000);

  return isDateInPast(endWithBuffer);
};

export const isEventGuestAppearance = (event: Event) => {
  return event.type === EventType.GuestAppearance;
};

export const isEventFestival = (event: Event) => {
  return event.type === EventType.Festival;
};

export const isEventSingleDay = (event: Event) => {
  return event.type === EventType.SingleDay;
};

export const isEventScanningEnabled = (event: Event) => {
  return event.options.enabledTicketScanning;
};

const DOOR_SALE_BUFFER_HOURS = 2;

export const isEventDoorSaleAvailable = (event: Event) => {
  const isActive = !isEventCompleted(event, DOOR_SALE_BUFFER_HOURS);
  const hasPrice = event.cashTicketPrice !== null && event.cashTicketPrice > 0;
  return isActive && hasPrice;
};
