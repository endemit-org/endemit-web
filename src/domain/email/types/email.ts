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
  locale?: string;
  tickets: {
    shortId: string;
    ticketHash: string;
    ticketHolderName: string;
    ticketPayerEmail: string;
    price: number;
    qrCode: string;
    metadata: Record<string, unknown> | null;
  }[];
}
