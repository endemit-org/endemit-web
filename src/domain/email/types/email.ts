import { Prisma } from "@prisma/client";

export enum EmailQueueEvent {
  SEND_EVENT_REMINDER = "send-event-reminder",
}

export interface EventReminderData {
  recipientEmail: string;
  eventId: string;
  eventName: string;
  eventDate: string; // ISO string
  eventPromoImageUrl: string;
  venue: {
    name: string;
    address: string;
    mapUrl: string;
  };
  artists: { name: string }[];
  tickets: {
    shortId: string;
    ticketHash: string;
    ticketHolderName: string;
    ticketPayerEmail: string;
    price: number;
    qrContent: Prisma.JsonValue;
    metadata: Record<string, unknown> | null;
  }[];
}
