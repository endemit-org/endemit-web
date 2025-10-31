import { Ticket } from "@prisma/client";

export interface TicketPayload {
  shortId: string;
  eventId: string;
  eventName: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  orderId: string;
  price: number;
  salt?: string;
}

export interface QrTicketPayload extends Omit<TicketPayload, "salt"> {
  hash: string;
}

export type TicketEmailData = Pick<
  Ticket,
  | "id"
  | "eventName"
  | "ticketHolderName"
  | "ticketPayerEmail"
  | "qrContent"
  | "ticketHash"
> & {
  eventCoverImageUrl: string;
  eventPromoImageUrl: string;
  eventDate: Date;
  mapUrl: string;
  address: string;
};

export enum TicketQueueEvent {
  CREATE_TICKET = "create-ticket",
}

export type TicketCreationData = {
  eventId: string;
  eventName: string;
  ticketHolderName: string;
  ticketPayerEmail: string;
  price: number;
  orderId: string;
  metadata?: Record<string, string | number | boolean>;
};

export type SerializedTicket = Omit<Ticket, "createdAt|updatedAt"> & {
  price: number;
};
