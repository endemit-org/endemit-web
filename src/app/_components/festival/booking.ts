import type { FestivalOffer } from "./data";

export const BOOKING_STORAGE_KEY = "festival-2027-booking";
export const MAX_PEOPLE = 12;

export type Booking = {
  people: number;
  tents: number;
  bus: number;
  /** Offer key of the chosen wallet top up, or null. */
  topup: string | null;
};

export const EMPTY_BOOKING: Booking = { people: 2, tents: 0, bus: 0, topup: null };

export type BookingLine = { offer: FestivalOffer; quantity: number };

/**
 * Cheapest set of ticket products that issues exactly `people` tickets.
 * Returns ticket offer key -> quantity.
 */
export function cheapestTickets(tickets: FestivalOffer[], people: number): Map<string, number> {
  const units = tickets.filter(ticket => ticket.people > 0);
  const best: ({ cost: number; picks: Map<string, number> } | null)[] = [{ cost: 0, picks: new Map() }];
  for (let count = 1; count <= people; count++) {
    best[count] = null;
    for (const unit of units) {
      const previous = count >= unit.people ? best[count - unit.people] : null;
      if (!previous) continue;
      const cost = previous.cost + unit.price;
      if (!best[count] || cost < best[count]!.cost) {
        const picks = new Map(previous.picks);
        picks.set(unit.key, (picks.get(unit.key) ?? 0) + 1);
        best[count] = { cost, picks };
      }
    }
  }
  return best[people]?.picks ?? new Map();
}

export function bookingLines(offers: FestivalOffer[], booking: Booking): BookingLine[] {
  const byKey = new Map(offers.map(offer => [offer.key, offer]));
  const tickets = offers.filter(offer => offer.kind === "ticket");
  const lines: BookingLine[] = [];
  for (const [key, quantity] of cheapestTickets(tickets, booking.people)) {
    lines.push({ offer: byKey.get(key)!, quantity });
  }
  // Largest bundle first reads best in the summary.
  lines.sort((a, b) => b.offer.people - a.offer.people);
  const add = (key: string | null, quantity: number) => {
    const offer = key ? byKey.get(key) : undefined;
    if (offer && quantity > 0) lines.push({ offer, quantity });
  };
  add("tent", booking.tents);
  add("bus", booking.bus);
  add(booking.topup, 1);
  return lines;
}

export const linesTotal = (lines: BookingLine[]) =>
  lines.reduce((sum, line) => sum + line.offer.price * line.quantity, 0);

const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

/** Validates anything read back from storage. */
export function normalizeBooking(value: unknown): Booking {
  const raw = value && typeof value === "object" ? (value as Partial<Booking>) : {};
  const people = clamp(raw.people, 1, MAX_PEOPLE, EMPTY_BOOKING.people);
  return {
    people,
    tents: clamp(raw.tents, 0, people, 0),
    bus: clamp(raw.bus, 0, people, 0),
    topup: typeof raw.topup === "string" && /^topup-\d+$/.test(raw.topup) ? raw.topup : null,
  };
}

export function readBooking(): Booking | null {
  try {
    const stored = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
    return stored ? normalizeBooking(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

export function writeBooking(booking: Booking) {
  try {
    window.sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(booking));
  } catch {
    // Storage can be unavailable (private mode); the builder still works in memory.
  }
}
