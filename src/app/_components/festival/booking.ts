/** Design-preview prices only. Never submit these items to the live checkout API. */
export type Booking = {
  pass: "single" | "duo" | "group";
  groupSize: number;
  tents: number;
  transport: number;
  origin: "ljubljana" | "maribor";
  credit: number;
};
export const initialBooking: Booking = {
  pass: "single",
  groupSize: 4,
  tents: 0,
  transport: 0,
  origin: "ljubljana",
  credit: 0,
};
export const bookingKey = "endemit-festival-design-booking-v2";
export function peopleFor(b: Booking) {
  return b.pass === "duo" ? 2 : b.pass === "group" ? b.groupSize : 1;
}
export function walletCreditFor(amount: number) {
  return Math.round(amount * 110) / 100;
}
export const formatCredit = (amount: number, locale: "en" | "sl") =>
  `${new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE", { maximumFractionDigits: 2 }).format(amount)} ǝŧ`;

export function bookingTotals(b: Booking) {
  const people = peopleFor(b);
  const passes =
    b.pass === "single" ? 89 : b.pass === "duo" ? 168 : people * 79;
  const tents = b.tents * 45,
    transport = b.transport * 25;
  return {
    people,
    passes,
    tents,
    transport,
    credit: b.credit,
    walletCredit: walletCreditFor(b.credit),
    walletBonus: Math.round(b.credit * 10) / 100,
    total: passes + tents + transport + b.credit,
  };
}
export function normalizeBooking(value: unknown): Booking {
  const v =
    value && typeof value === "object" ? (value as Partial<Booking>) : {};
  const count = (n: unknown, min: number, max: number, fallback: number) =>
    typeof n === "number" && Number.isFinite(n)
      ? Math.max(min, Math.min(max, Math.floor(n)))
      : fallback;
  const pass = v.pass === "duo" || v.pass === "group" ? v.pass : "single";
  const groupSize = count(v.groupSize, 4, 10, 4);
  const people = pass === "single" ? 1 : pass === "duo" ? 2 : groupSize;
  return {
    pass,
    groupSize,
    tents: count(v.tents, 0, Math.ceil(people / 2), 0),
    transport: count(v.transport, 0, people, 0),
    origin: v.origin === "maribor" ? "maribor" : "ljubljana",
    credit: [0, 25, 50, 100].includes(v.credit ?? -1) ? v.credit! : 0,
  };
}
export const money = (n: number, locale: "en" | "sl") =>
  new Intl.NumberFormat(locale === "sl" ? "sl-SI" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
