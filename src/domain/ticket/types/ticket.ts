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

export type TicketEmailData = Pick<
  Ticket,
  | "id"
  | "eventName"
  | "ticketHolderName"
  | "ticketPayerEmail"
  | "qrContent"
  | "ticketHash"
>;

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
