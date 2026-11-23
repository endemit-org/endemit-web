"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation";
import { formatPrice } from "@/lib/util/formatting";
import type { FestivalLocale } from "./copy";
import type { FestivalOffer } from "./data";
import { bookingLines, cheapestTickets, EMPTY_BOOKING, linesTotal, MAX_PEOPLE, PASSES, readBooking, writeBooking, type Booking } from "./booking";
import styles from "./festival.module.css";

const text = {
  en: {
    pass: "Which ticket?",
    passes: { weekend: "Whole weekend", friday: "Friday", saturday: "Saturday" },
    passDates: { weekend: "13–15 Aug", friday: "13 Aug", saturday: "14 Aug" },
    dayNote: "Entry for this evening only. The bus runs for the whole weekend only.",
    upsell: "The whole weekend is only",
    upsellMore: "more per person.",
    people: "How many are coming?",
    peopleNote: "Every holder's name is added at checkout",
    perPerson: "per person",
    save: "You save",
    tent: "Tent rental",
    bus: "Bus seats",
    topup: "Wallet top up",
    topupNote: "Food and drinks are paid with the Wallet only",
    none: "Later",
    total: "Total",
    checkout: "Continue to payment",
    closed: "Ticket sale opens soon. Leave your email below and you hear first.",
    notify: "Tell me when",
    demo: "Demo: products are not published yet. Prices are placeholders and nothing is charged.",
    less: "Less",
    more: "More",
  },
  sl: {
    pass: "Kero karto?",
    passes: { weekend: "Cel vikend", friday: "Petek", saturday: "Sobota" },
    passDates: { weekend: "13.–15. avg.", friday: "13. avg.", saturday: "14. avg." },
    dayNote: "Vstop sam za ta večer. Bus vozi sam za cel vikend.",
    upsell: "Cel vikend je sam",
    upsellMore: "več na glavo.",
    people: "Kok vas pride?",
    peopleNote: "Imena imetnikov vpišeš pr plačilo",
    perPerson: "na glavo",
    save: "Prišparaš",
    tent: "Najem šotora",
    bus: "Sedeži na buso",
    topup: "Polnitev denarnce",
    topupNote: "Hrana pa pijača se plača sam z Denarnco",
    none: "Poznej",
    total: "Skop",
    checkout: "Naprej na plačilo",
    closed: "Prodaja kart se ofne kmalo. Posti email spodi pa zveš prvi.",
    notify: "Javi mi",
    demo: "Demo: produkti še niso objavleni. Cene so začasne, nč se ne zaračuna.",
    less: "Mn",
    more: "Več",
  },
} as const;

const TentIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 6.5 4.5 25.5h23L16 6.5Z" />
    <path d="M16 6.5V4M12 25.5l4-8 4 8" />
  </svg>
);

const SeatIcon = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 7v12.5H23" strokeWidth="4.6" />
    <path d="M13 24v3.5M22 24v3.5M17 14h5" strokeWidth="2.4" />
  </svg>
);

function Units({ count, tone, children }: { count: number; tone: "tent" | "seat"; children: ReactNode }) {
  if (count < 1) return null;
  return (
    <div className={styles.units} data-tone={tone} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>{children}</span>
      ))}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  less,
  more,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  less: string;
  more: string;
}) {
  return (
    <span className={styles.stepper} role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`${less}: ${label}`}>
        −
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`${more}: ${label}`}>
        +
      </button>
    </span>
  );
}

export default function TicketBuilder({
  locale,
  offers,
  salesOpen,
  demo = false,
}: {
  locale: FestivalLocale;
  offers: FestivalOffer[];
  salesOpen: boolean;
  demo?: boolean;
}) {
  const t = text[locale];
  const router = useRouter();
  const [booking, setBooking] = useState<Booking>(EMPTY_BOOKING);

  // Restore a booking started earlier in this tab.
  useEffect(() => {
    const stored = readBooking();
    if (stored) setBooking(stored);
  }, []);

  const update = (patch: Partial<Booking>) =>
    setBooking(current => {
      const next = { ...current, ...patch };
      next.tents = Math.min(next.tents, next.people);
      next.bus = Math.min(next.bus, next.people);
      writeBooking(next);
      return next;
    });

  const lines = useMemo(() => bookingLines(offers, booking), [offers, booking]);
  const total = linesTotal(lines);
  const ticketLines = lines.filter(line => line.offer.kind === "ticket" || line.offer.kind === "day");
  const isDay = booking.pass !== "weekend";
  // Evenings are offered only when their product can be sold.
  const passes = PASSES.filter(pass => pass === "weekend" || offers.some(offer => offer.key === pass && (offer.sellable || !salesOpen)));
  // What the same group would pay per person for the whole weekend.
  const weekendOffers = offers.filter(offer => offer.kind === "ticket");
  const weekendTotal = [...cheapestTickets(weekendOffers, booking.people)].reduce((sum, [key, quantity]) => sum + (weekendOffers.find(offer => offer.key === key)?.price ?? 0) * quantity, 0);
  const ticketTotal = linesTotal(ticketLines);
  const single = offers.find(offer => offer.key === "single");
  const saving = single && !isDay ? single.price * booking.people - ticketTotal : 0;
  const upsell = isDay ? (weekendTotal - ticketTotal) / booking.people : 0;
  const tent = offers.find(offer => offer.key === "tent");
  const bus = offers.find(offer => offer.key === "bus");
  const topups = offers.filter(offer => offer.kind === "topup" && (offer.sellable || !salesOpen));
  const extraAvailable = (offer?: FestivalOffer) => Boolean(offer && (offer.sellable || !salesOpen));

  return (
    <div className={styles.builder}>
      <span className={styles.stub} aria-hidden>
        Endemit festival · 13–15 · 08 · 2027 · Libeliče
      </span>
      {passes.length > 1 ? (
        <div className={styles.passes} role="radiogroup" aria-label={t.pass}>
          {passes.map(pass => (
            <button key={pass} type="button" role="radio" aria-checked={booking.pass === pass} className={styles.pass} onClick={() => update({ pass })}>
              <b>{t.passes[pass]}</b>
              <small>{t.passDates[pass]}</small>
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.row} style={{ alignItems: "flex-start" }}>
        <div>
          <span className={styles.rowLabel}>{t.people}</span>
          <span className={styles.rowNote}>{t.peopleNote}</span>
          <div className={styles.people} aria-hidden>
            {Array.from({ length: booking.people }, (_, i) => (
              <img key={i} src={`/images/festival/2027/creature-${(i % 6) + 1}.webp`} width={200} height={266} alt="" />
            ))}
          </div>
          <p className={styles.combo}>
            {ticketLines.map((line, i) => (
              <span key={line.offer.key}>
                {i > 0 ? " + " : ""}
                {line.quantity}× <b>{line.offer.label}</b>
              </span>
            ))}
            {" · "}
            {formatPrice(ticketTotal / booking.people)} {t.perPerson}
            {saving > 0 ? (
              <>
                {" · "}
                <b>
                  {t.save} {formatPrice(saving)}
                </b>
              </>
            ) : null}
          </p>
          {isDay ? (
            <p className={styles.rowNote}>
              {t.dayNote}
              {upsell > 0 ? (
                <>
                  {" "}
                  <button type="button" className={styles.linkButton} onClick={() => update({ pass: "weekend" })}>
                    {t.upsell} {formatPrice(upsell)} {t.upsellMore}
                  </button>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <Stepper value={booking.people} min={1} max={MAX_PEOPLE} onChange={people => update({ people })} label={t.people} less={t.less} more={t.more} />
      </div>

      {extraAvailable(tent) && tent ? (
        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>
              {t.tent} · {formatPrice(tent.price)}
            </span>
            <span className={styles.rowNote}>{tent.note}</span>
            <Units count={booking.tents} tone="tent">
              <TentIcon />
            </Units>
          </div>
          <Stepper value={booking.tents} min={0} max={booking.people} onChange={tents => update({ tents })} label={t.tent} less={t.less} more={t.more} />
        </div>
      ) : null}

      {extraAvailable(bus) && bus && !isDay ? (
        <div className={styles.row}>
          <div>
            <span className={styles.rowLabel}>
              {t.bus} · {formatPrice(bus.price)}
            </span>
            <span className={styles.rowNote}>{bus.note}</span>
            <Units count={booking.bus} tone="seat">
              <SeatIcon />
            </Units>
          </div>
          <Stepper value={booking.bus} min={0} max={booking.people} onChange={value => update({ bus: value })} label={t.bus} less={t.less} more={t.more} />
        </div>
      ) : null}

      {topups.length ? (
        <div className={styles.row} style={{ flexWrap: "wrap" }}>
          <div>
            <span className={styles.rowLabel}>{t.topup}</span>
            <span className={styles.rowNote}>{t.topupNote}</span>
          </div>
          <div className={styles.chips}>
            <button type="button" className={styles.chip} aria-pressed={booking.topup === null} onClick={() => update({ topup: null })}>
              {t.none}
            </button>
            {topups.map(offer => (
              <button key={offer.key} type="button" className={styles.chip} aria-pressed={booking.topup === offer.key} onClick={() => update({ topup: offer.key })}>
                {offer.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className={styles.total}>
        <span className={styles.rowLabel}>{t.total}</span>
        <span className={`${styles.totalSum} ${styles.boilSmall}`}>{formatPrice(total)}</span>
      </div>

      {demo ? <p className={styles.notice}>{t.demo}</p> : null}
      {salesOpen ? (
        <div className={styles.builderActions}>
          <button
            type="button"
            className={`${styles.tag} ${styles.tagSolid}`}
            onClick={() => {
              writeBooking(booking);
              router.push("/festival/checkout");
            }}
          >
            {t.checkout} →
          </button>
        </div>
      ) : (
        <>
          <p className={styles.notice}>{t.closed}</p>
          <div className={styles.builderActions}>
            <a className={styles.tag} href="#newsletter">
              {t.notify} ↓
            </a>
          </div>
        </>
      )}
    </div>
  );
}
