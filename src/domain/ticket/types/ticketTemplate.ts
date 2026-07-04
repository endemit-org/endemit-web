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

/** Locale-keyed string for text baked into the rendered ticket PNG (Satori, not next-intl). */
export type LocalizedTicketText = Record<"sl" | "en", string>;

export interface TicketTextContent {
  priceLabel: LocalizedTicketText | null; // null = show actual price, map = custom label
  tagline: LocalizedTicketText | null; // Optional tagline below price label
  legalText: LocalizedTicketText;
}

export interface TicketTemplate {
  id: TicketTemplateId;
  name: string;
  colorScheme: TicketColorScheme;
  textContent: TicketTextContent;
  invertLogo: boolean;
}
