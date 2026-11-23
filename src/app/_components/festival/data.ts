import "server-only";

import { fetchEventFromCmsByUid } from "@/domain/cms/operations/fetchEventFromCms";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductSellable } from "@/domain/product/businessLogic";
import type { Product } from "@/domain/product/types/product";
import type { FestivalLocale } from "./copy";

export const FESTIVAL_EVENT_UID = "endemit-festival-2027";

/** "ticket" is a weekend ticket, "day" a ticket for one evening. */
export type OfferKind = "ticket" | "day" | "tent" | "bus" | "topup";

export type FestivalOffer = {
  key: string;
  kind: OfferKind;
  uid: string;
  label: string;
  note: string;
  /** EUR. From Prismic when the product is published, otherwise the fallback. */
  price: number;
  /** Extra Wallet tokens credited on top of a top up (the product's top-up reward). */
  bonus: number;
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
  /** Walk-through mode: the whole purchase can be clicked through, nothing is charged. */
  demo: boolean;
};

/**
 * Ticket prices per release, in EUR. Weekend prices are confirmed. A single
 * evening is priced above half a weekend on purpose, so two evenings always
 * cost clearly more than the weekend. Day prices are a proposal.
 */
const BATCHES = [
  { key: "blind", from: "2026-11-22T23:00:00Z", until: "2027-01-31T22:59:00Z", single: 85, duo: 160, group: 300, day: 55 },
  { key: "first", from: "2027-01-31T23:00:00Z", until: "2027-04-30T21:59:00Z", single: 95, duo: 180, group: 340, day: 60 },
  { key: "second", from: "2027-04-30T22:00:00Z", until: "2027-07-31T21:59:00Z", single: 105, duo: 200, group: 380, day: 65 },
  { key: "last", from: "2027-07-31T22:00:00Z", until: "2027-08-15T15:00:00Z", single: 115, duo: 220, group: 420, day: 70 },
] as const;

type Batch = (typeof BATCHES)[number];

const BATCH_NAMES: Record<FestivalLocale, Record<Batch["key"], string>> = {
  en: { blind: "Blind tickets", first: "First batch", second: "Second batch", last: "Last batch" },
  sl: { blind: "Karte na slepo", first: "Prva runda", second: "Druga runda", last: "Zadna runda" },
};

/** The release on sale at `now`; the first one before sales start, the last one after. */
function currentBatch(now: number): Batch {
  return BATCHES.find(batch => now <= Date.parse(batch.until)) ?? BATCHES[BATCHES.length - 1];
}

type OfferSeed = {
  key: string;
  kind: OfferKind;
  uid: string;
  people?: number;
  /** Used only until the product is published in Prismic. */
  fallbackPrice: (batch: Batch) => number;
  /** Proposed top-up bonus, shown until the product carries its own reward. */
  fallbackBonus?: number;
  label: Record<FestivalLocale, string>;
  note: Record<FestivalLocale, string>;
};

const OFFER_SEEDS: OfferSeed[] = [
  {
    key: "single", kind: "ticket", uid: "endemit-festival-2027-single-ticket", people: 1, fallbackPrice: batch => batch.single,
    label: { en: "Solo", sl: "Solo" },
    note: { en: "One ticket", sl: "Ena karta" },
  },
  {
    key: "duo", kind: "ticket", uid: "endemit-festival-2027-duo-ticket", people: 2, fallbackPrice: batch => batch.duo,
    label: { en: "Duo", sl: "Duo" },
    note: { en: "Two tickets", sl: "Dve karti" },
  },
  {
    key: "group", kind: "ticket", uid: "endemit-festival-2027-group-ticket", people: 4, fallbackPrice: batch => batch.group,
    label: { en: "Group", sl: "Skupinska" },
    note: { en: "Four tickets", sl: "Štiri karte" },
  },
  {
    // One ticket, one entry, on either evening: the holder decides on the day.
    key: "evening", kind: "day", uid: "endemit-festival-2027-evening-ticket", people: 1, fallbackPrice: batch => batch.day,
    label: { en: "One evening", sl: "En večer" },
    note: { en: "Friday or Saturday, your pick on the day", sl: "Petek al sobota, zbereš na dan" },
  },
  {
    key: "tent", kind: "tent", uid: "endemit-festival-2027-tent", fallbackPrice: () => 30,
    label: { en: "Tent rental", sl: "Najem šotora" },
    note: { en: "Rented for the festival, set up and waiting at the camp", sl: "V najem za festival, postavlen in prpravlen v kampo" },
  },
  {
    key: "bus", kind: "bus", uid: "endemit-festival-2027-bus-ljubljana", fallbackPrice: () => 15,
    label: { en: "Bus from Ljubljana", sl: "Bus iz Lublane" },
    note: { en: "Ljubljana – Libeliče – Ljubljana, one return seat", sl: "Ljubljana – Libeliče – Ljubljana, en povratn sedež" },
  },
  // Bonus tokens are a proposal: roughly 10, 12 and 15 percent on top.
  ...([[20, 2], [50, 6], [100, 15]] as const).map(
    ([amount, bonus]): OfferSeed => ({
      key: `topup-${amount}`, kind: "topup", uid: `wallet-top-up-${amount}-tokens`, fallbackPrice: () => amount, fallbackBonus: bonus,
      label: { en: `${amount} ǝŧ`, sl: `${amount} ǝŧ` },
      note: { en: "Wallet top up", sl: "Polnitev denarnce" },
    })
  ),
];

/** Shown until the event's ticket_price_progress slice is published. */
function fallbackTimeline(locale: FestivalLocale): TimelineStep[] {
  const words = locale === "sl" ? { group: "Skupinska", day: "en večer" } : { group: "Group", day: "one evening" };
  return BATCHES.map(batch => ({
    title: BATCH_NAMES[locale][batch.key],
    description: `Duo ${batch.duo} · ${words.group} ${batch.group} · ${words.day} ${batch.day}`,
    price: batch.single,
    from: batch.from,
    until: batch.until,
  }));
}

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

  const batch = currentBatch(Date.now());
  const offers = OFFER_SEEDS.map((seed, index): FestivalOffer => {
    const product = products[index];
    return {
      key: seed.key,
      kind: seed.kind,
      uid: seed.uid,
      label: seed.label[locale],
      note: seed.note[locale],
      price: product?.price ?? seed.fallbackPrice(batch),
      bonus: product?.walletTopupReward ?? 0,
      people: seed.people ?? 0,
      product,
      sellable: product ? isProductSellable(product).isSellable : false,
    };
  });

  const tickets = offers.filter(offer => offer.kind === "ticket");
  const live = tickets.length > 0 && tickets.every(offer => offer.sellable);
  // On local dev and Vercel previews, while the products are not published
  // yet, the flow opens as a demo with the placeholder prices for review.
  const demo = !live && (process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview");
  if (demo) {
    offers.forEach((offer, index) => {
      offer.sellable = true;
      // The proposed top-up bonus shows in demo only; live, the product's own reward decides.
      if (!offer.bonus) offer.bonus = OFFER_SEEDS[index].fallbackBonus ?? 0;
    });
  }
  return {
    demo,
    offers,
    timeline: timelineFromSlices(event?.slices, locale) ?? fallbackTimeline(locale),
    salesOpen: live || demo,
    showLineup: (event?.artists?.length ?? 0) > 0,
  };
}
