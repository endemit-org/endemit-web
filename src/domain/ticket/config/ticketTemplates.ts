import type { TicketTemplate } from "../types/ticketTemplate";

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
    legalText: {
      en: "Ticket admits one person. Ticket is transferable, but non-refundable.",
      sl: "Karta velja za eno osebo. Karta je prenosljiva, ampak nevračljiva.",
    },
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
    // The code itself stays dark-on-light (inverted codes scan poorly); the
    // black frame around it carries the guest look.
    qrDark: "#000000",
    qrLight: "#ffffff",
  },
  textContent: {
    priceLabel: { en: "VIP PASS", sl: "VIP PASS" },
    tagline: {
      en: "GUEST PASS :: NOT FOR SALE",
      sl: "GOST :: NI NAPRODAJ",
    },
    legalText: {
      en: "Ticket admits one person. Non-transferable, non-refundable.",
      sl: "Karta velja za eno osebo. Ni prenosljiva, ni vračljiva.",
    },
  },
  invertLogo: true,
};

// Festival: night sky and salmon, as on the festival page. The whole weekend
// is the dark ticket, a single evening the light one, so the two can be told
// apart at arm's length.
export const FESTIVAL_TEMPLATE: TicketTemplate = {
  id: "festival",
  name: "Festival weekend",
  colorScheme: {
    background: "#0c0a45",
    text: "#f6e9df",
    textSecondary: "#a99bea",
    border: "#f4a78f",
    accent: "#f4a78f",
    // The code stays dark-on-light: inverted codes scan poorly.
    qrDark: "#0c0a45",
    qrLight: "#ffffff",
  },
  textContent: {
    priceLabel: { en: "WHOLE WEEKEND", sl: "CEL VIKEND" },
    tagline: { en: "13–15 AUGUST · ALL THREE DAYS", sl: "13.–15. AVGUST · VSI TRIJE DNEVI" },
    legalText: {
      en: "Ticket admits one person for the whole festival. Ticket is transferable, but non-refundable.",
      sl: "Karta velja za eno osebo za cel festival. Karta je prenosljiva, ampak nevračljiva.",
    },
  },
  invertLogo: true,
  doorLabel: { en: "WHOLE WEEKEND", sl: "CEL VIKEND" },
};

export const FESTIVAL_EVENING_TEMPLATE: TicketTemplate = {
  id: "festival-evening",
  name: "Festival single evening",
  colorScheme: {
    background: "#f4a78f",
    text: "#0c0a45",
    textSecondary: "#3a2a8c",
    border: "#ee3b4f",
    accent: "#ee3b4f",
    qrDark: "#0c0a45",
    qrLight: "#ffffff",
  },
  textContent: {
    priceLabel: { en: "ONE EVENING", sl: "EN VEČER" },
    tagline: { en: "FRIDAY OR SATURDAY · ONE ENTRY", sl: "PETEK AL SOBOTA · EN VSTOP" },
    legalText: {
      en: "Ticket admits one person for one evening, Friday or Saturday. Ticket is transferable, but non-refundable.",
      sl: "Karta velja za eno osebo za en večer, petek al soboto. Karta je prenosljiva, ampak nevračljiva.",
    },
  },
  invertLogo: false,
  doorLabel: { en: "ONE EVENING", sl: "EN VEČER" },
};

export function getTemplateById(id: string | undefined): TicketTemplate {
  switch (id) {
    case "guest":
      return GUEST_TEMPLATE;
    case "festival":
      return FESTIVAL_TEMPLATE;
    case "festival-evening":
      return FESTIVAL_EVENING_TEMPLATE;
    case "default":
    default:
      return DEFAULT_TEMPLATE;
  }
}
