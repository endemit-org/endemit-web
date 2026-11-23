import "server-only";

import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductSellable } from "@/domain/product/businessLogic";
import type { Product } from "@/domain/product/types/product";
import type { FestivalLocale } from "./copy";

export const FESTIVAL_EVENT_UID = "endemit-festival-2027";

export type OfferKind = "ticket" | "tent" | "bus" | "topup";

export type FestivalOffer = {
  key: string;
  kind: OfferKind;
  uid: string;
  label: string;
  note: string;
  /** EUR. From Prismic when the product is published, otherwise the fallback. */
  price: number;
  /** Tickets issued by one unit (1 single, 2 duo, 4 group). */
  people: number;
  /** Full product for the checkout request; null while unpublished. */
  product: Product | null;
  sellable: boolean;
};

export type TimelineStep = {
  title: string;
  description: string;
  price: number | null;
  from: string;
  until: string;
};

export type FestivalData = {
  offers: FestivalOffer[];
  timeline: TimelineStep[];
  /** True when every ticket product is published and sellable. */
  salesOpen: boolean;
  showLineup: boolean;
};

type OfferSeed = {
  key: string;
  kind: OfferKind;
  uid: string;
  people?: number;
  /** Used only until the product is published in Prismic. */
  fallbackPrice: number;
  label: Record<FestivalLocale, string>;
  note: Record<FestivalLocale, string>;
};

// Fallback ticket prices are placeholders; tent and bus prices are confirmed.
const OFFER_SEEDS: OfferSeed[] = [
  {
    key: "single", kind: "ticket", uid: "endemit-festival-2027-single-ticket", people: 1, fallbackPrice: 75,
    label: { en: "Solo", sl: "Solo" },
    note: { en: "One ticket", sl: "Ena karta" },
  },
  {
    key: "duo", kind: "ticket", uid: "endemit-festival-2027-duo-ticket", people: 2, fallbackPrice: 140,
    label: { en: "Duo", sl: "Duo" },
    note: { en: "Two tickets", sl: "Dve karti" },
  },
  {
    key: "group", kind: "ticket", uid: "endemit-festival-2027-group-ticket", people: 4, fallbackPrice: 260,
    label: { en: "Group", sl: "Skupinska" },
    note: { en: "Four tickets", sl: "Štiri karte" },
  },
  {
    key: "tent", kind: "tent", uid: "endemit-festival-2027-tent", fallbackPrice: 30,
    label: { en: "Tent", sl: "Šotor" },
    note: { en: "Set up and waiting at the camp", sl: "Postavlen in prpravlen v kampo" },
  },
  {
    key: "bus", kind: "bus", uid: "endemit-festival-2027-bus-ljubljana", fallbackPrice: 15,
    label: { en: "Bus from Ljubljana", sl: "Bus iz Lublane" },
    note: { en: "One seat to Libeliče", sl: "En sedež do Libelič" },
  },
  ...[20, 50, 100].map(
    (amount): OfferSeed => ({
      key: `topup-${amount}`, kind: "topup", uid: `wallet-top-up-${amount}-tokens`, fallbackPrice: amount,
      label: { en: `${amount} ǝŧ`, sl: `${amount} ǝŧ` },
      note: { en: "Wallet top up", sl: "Polnitev denarnce" },
    })
  ),
];

// Placeholder batches, shown until the event's ticket_price_progress slice is published.
const FALLBACK_TIMELINE: Record<FestivalLocale, TimelineStep[]> = {
  en: [
    { title: "Blind tickets", description: "No line up yet", price: 75, from: "2026-11-23T23:00:00Z", until: "2027-01-31T22:59:00Z" },
    { title: "First batch", description: "Duo 160, Group 300", price: 85, from: "2027-01-31T23:00:00Z", until: "2027-04-30T21:59:00Z" },
    { title: "Second batch", description: "Duo 180, Group 340", price: 95, from: "2027-04-30T22:00:00Z", until: "2027-07-31T21:59:00Z" },
    { title: "Last batch", description: "Festival price", price: 120, from: "2027-07-31T22:00:00Z", until: "2027-08-15T15:00:00Z" },
  ],
  sl: [
    { title: "Karte na slepo", description: "Brez line upa", price: 75, from: "2026-11-23T23:00:00Z", until: "2027-01-31T22:59:00Z" },
    { title: "Prva runda", description: "Duo 160, Skupinska 300", price: 85, from: "2027-01-31T23:00:00Z", until: "2027-04-30T21:59:00Z" },
    { title: "Druga runda", description: "Duo 180, Skupinska 340", price: 95, from: "2027-04-30T22:00:00Z", until: "2027-07-31T21:59:00Z" },
    { title: "Zadna runda", description: "Festivalska cena", price: 120, from: "2027-07-31T22:00:00Z", until: "2027-08-15T15:00:00Z" },
  ],
};

type RawSlice = { slice_type?: string; items?: Record<string, unknown>[] };

function timelineFromSlices(slices: unknown, locale: FestivalLocale): TimelineStep[] | null {
  const slice = (Array.isArray(slices) ? (slices as RawSlice[]) : []).find(
    s => s?.slice_type === "ticket_price_progress"
  );
  if (!slice?.items?.length) return null;
  const text = (item: Record<string, unknown>, field: string) => {
    const localized = locale === "sl" ? item[`${field}_sl`] : null;
    return String(localized || item[field] || "");
  };
  const steps = slice.items
    .filter(item => item.available_from && item.available_until)
    .map(item => ({
      title: text(item, "title"),
      description: text(item, "description"),
      // Slice prices are stored in cents.
      price: typeof item.price === "number" ? item.price / 100 : null,
      from: String(item.available_from),
      until: String(item.available_until),
    }));
  return steps.length ? steps : null;
}

export async function loadFestival(locale: FestivalLocale): Promise<FestivalData> {
  const [event, products] = await Promise.all([
    fetchEventFromCmsByUid(FESTIVAL_EVENT_UID, locale).catch(() => null),
    Promise.all(OFFER_SEEDS.map(seed => fetchProductFromCmsByUid(seed.uid, locale).catch(() => null))),
  ]);

  const offers = OFFER_SEEDS.map((seed, index): FestivalOffer => {
    const product = products[index];
    return {
      key: seed.key,
      kind: seed.kind,
      uid: seed.uid,
      label: seed.label[locale],
      note: seed.note[locale],
      price: product?.price ?? seed.fallbackPrice,
      people: seed.people ?? 0,
      product,
      sellable: product ? isProductSellable(product).isSellable : false,
    };
  });

  const tickets = offers.filter(offer => offer.kind === "ticket");
  return {
    offers,
    timeline: timelineFromSlices(event?.slices, locale) ?? FALLBACK_TIMELINE[locale],
    salesOpen: tickets.length > 0 && tickets.every(offer => offer.sellable),
    showLineup: (event?.artists?.length ?? 0) > 0,
  };
}
