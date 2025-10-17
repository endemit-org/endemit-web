import { Event, EventType } from "@/domain/event/types/event";

export const isEventCompleted = (event: Event) => {
  const now = new Date();

  if (!event.date_end) {
    return false;
  }

  const isCompleted = now.getTime() <= event.date_end.getTime();

  return isCompleted;
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
