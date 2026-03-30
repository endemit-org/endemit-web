export type TicketTemplateId = "default" | "guest";

export interface TicketColorScheme {
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
  qrDark: string;
  qrLight: string;
}

export interface TicketTextContent {
  priceLabel: string | null; // null = show actual price, string = custom label
  tagline: string | null;    // Optional tagline below price label
  legalText: string;
}

export interface TicketTemplate {
  id: TicketTemplateId;
  name: string;
  colorScheme: TicketColorScheme;
  textContent: TicketTextContent;
  invertLogo: boolean;
}
