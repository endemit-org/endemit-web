import type { TicketTemplate, TicketTemplateId } from "../types/ticketTemplate";

export const DEFAULT_TEMPLATE: TicketTemplate = {
  id: "default",
  name: "Standard Ticket",
  colorScheme: {
    background: "#ffffff",
    text: "#000000",
    textSecondary: "#AAAAAA",
    border: "#000000",
    accent: "#222222",
    qrDark: "#000000",
    qrLight: "#ffffff",
  },
  textContent: {
    priceLabel: null,
    tagline: null,
    legalText:
      "Ticket admits one person. Ticket is transferable, but non-refundable.",
  },
  invertLogo: false,
};

export const GUEST_TEMPLATE: TicketTemplate = {
  id: "guest",
  name: "VIP Guest Pass",
  colorScheme: {
    background: "#000000",
    text: "#ffffff",
    textSecondary: "#888888",
    border: "#ffffff",
    accent: "#ffffff",
    qrDark: "#ffffff",
    qrLight: "#000000",
  },
  textContent: {
    priceLabel: "VIP PASS",
    tagline: "VIP TICKET :: NOT FOR SALE",
    legalText: "Ticket admits one person. Non-transferable, non-refundable.",
  },
  invertLogo: true,
};

export function getTemplateById(id: string | undefined): TicketTemplate {
  switch (id) {
    case "guest":
      return GUEST_TEMPLATE;
    case "default":
    default:
      return DEFAULT_TEMPLATE;
  }
}
