import { Event, EventType } from "@/domain/event/types/event";
import { isDateInPast } from "@/lib/util/util";

export const isEventCompleted = (event: Event) => {
  if (!event.date_end) {
    return false;
  }

  return isDateInPast(event.date_end);
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
