import { Ticket } from "@prisma/client";

export const isTicketValidated = (ticket: Ticket) => {
  return ticket.status === "VALIDATED";
};

export const isTicketScanned = (ticket: Ticket) => {
  return ticket.status === "SCANNED";
};

export const isTicketChecked = (ticket: Ticket) => {
  return isTicketScanned(ticket) || isTicketValidated(ticket);
};

export const isTicketPending = (ticket: Ticket) => {
  return ticket.status === "PENDING";
};

export const isTicketInvalid = (ticket: Ticket) => {
  return (
    ticket.status === "CANCELLED" ||
    ticket.status === "REFUNDED" ||
    ticket.status === "BANNED"
  );
};
