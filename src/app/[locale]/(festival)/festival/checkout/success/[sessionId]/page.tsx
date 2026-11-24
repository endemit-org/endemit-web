/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PurchaseEvent from "@/app/_components/analytics/PurchaseEvent";
import AutoLoginOnSuccess from "@/app/_components/checkout/AutoLoginOnSuccess";
import BoilDefs from "@/app/_components/festival/BoilDefs";
import ClearFestivalBooking from "@/app/_components/festival/ClearFestivalBooking";
import type { FestivalLocale } from "@/app/_components/festival/copy";
import styles from "@/app/_components/festival/festival.module.css";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { getPaidOrderForSession } from "@/domain/order/operations/getPaidOrderForSession";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import type { ProductInOrder } from "@/domain/order/types/order";
import { ProductCategory } from "@/domain/product/types/product";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/util/formatting";

type PageProps = { params: Promise<{ locale: string; sessionId: string }> };

export const metadata: Metadata = {
  title: "Endemit festival · Order",
  robots: { index: false, follow: false },
};

const ART = "/images/festival/2027";
const DONATION_UID = "donation-to-association";
/** People admitted by one unit of each weekend ticket product. */
const WEEKEND_PEOPLE: Record<string, number> = {
  "endemit-festival-2027-single-ticket": 1,
  "endemit-festival-2027-duo-ticket": 2,
  "endemit-festival-2027-group-ticket": 4,
};
const EVENING_UID = "endemit-festival-2027-evening-ticket";
const TENT_UID = "endemit-festival-2027-tent";
const BUS_UID = "endemit-festival-2027-bus-ljubljana";

const text = {
  en: {
    title: "See you in Libeliče",
    paid: (id: string) => `Order ${id} is paid.`,
    confirmation: "The confirmation went to",
    weekend: "Whole weekend",
    evening: "One evening",
    tickets: "Tickets arrive by email within minutes, each with its own QR code. Camping is included.",
    eveningNote: "One entry, Friday or Saturday.",
    holders: "Holders",
    tent: "Tent rental",
    tentNote: "Set up and waiting for you at the camp.",
    bus: "Bus",
    busNote: "Ljubljana – Libeliče – Ljubljana. Departure time and place come by email before the festival.",
    wallet: "Wallet",
    walletNote: "The tokens land in your Wallet within minutes.",
    donation: "Donation",
    donationNote: "Thank you. It keeps ticket prices low.",
    account: "Your account",
    accountNote: "Sign in any time with this email. There is no password: the sign-in code comes by email.",
    order: "My order",
    back: "Back to the festival",
  },
  sl: {
    title: "Vidmo se v Libeličah",
    paid: (id: string) => `Naročilo ${id} je plačano.`,
    confirmation: "Potrditev je šla na",
    weekend: "Cel vikend",
    evening: "En večer",
    tickets: "Karte pridejo na email v parih minutah, vsaka s svojo QR kodo. Kampiranje je zraven.",
    eveningNote: "En vstop, petek al sobota.",
    holders: "Imetniki",
    tent: "Najem šotora",
    tentNote: "Postavlen te čaka v kampo.",
    bus: "Bus",
    busNote: "Ljubljana – Libeliče – Ljubljana. Uro pa plac odhoda javmo na email pred festivalom.",
    wallet: "Denarnca",
    walletNote: "Žetoni pridejo v tvojo Denarnco v parih minutah.",
    donation: "Donacija",
    donationNote: "Hvala. S tem držiš cene kart nizke.",
    account: "Tvoj račun",
    accountNote: "Prjaviš se kadarkol s tem emailom. Gesla ni: kodo za vpis dobiš na email.",
    order: "Moje naročilo",
    back: "Nazaj na festival",
  },
} as const;

/** Sample order lines for the development preview. */
const SAMPLE_ITEMS = [
  { uid: "endemit-festival-2027-duo-ticket", quantity: 1, price: 160 },
  { uid: TENT_UID, quantity: 1, price: 30 },
  { uid: BUS_UID, quantity: 2, price: 15 },
  { uid: "endemit-festival-2027-top-up-50", quantity: 1, price: 50, walletTopupReward: 6, category: ProductCategory.CURRENCIES },
  { uid: DONATION_UID, quantity: 5, price: 1 },
];

type Row = { title: string; amount: string; note: string; extra?: string };

export default async function FestivalSuccessPage({ params }: PageProps) {
  const { locale: rawLocale, sessionId } = await params;
  const locale: FestivalLocale = rawLocale === "en" ? "en" : "sl";
  setRequestLocale(locale);
  const t = text[locale];

  // Local development only: /festival/checkout/success/preview shows a sample order.
  const preview = process.env.NODE_ENV === "development" && sessionId === "preview";
  const paid = preview || !sessionId ? null : await getPaidOrderForSession(sessionId).catch(() => null);
  if (!paid && !preview) notFound();
  const order = paid ?? { id: "FEST-PREVIEW", email: "ana@example.com", userId: null, totalAmount: 0, items: SAMPLE_ITEMS };

  const items = (order.items ?? []) as unknown as ProductInOrder[];
  const count = (match: (item: ProductInOrder) => number) => items.reduce((sum, item) => sum + match(item), 0);
  const weekend = count(item => (WEEKEND_PEOPLE[item.uid] ?? 0) * item.quantity);
  const evening = count(item => (item.uid === EVENING_UID ? item.quantity : 0));
  const tents = count(item => (item.uid === TENT_UID ? item.quantity : 0));
  const bus = count(item => (item.uid === BUS_UID ? item.quantity : 0));
  const tokens = count(item => (item.category === ProductCategory.CURRENCIES ? (item.price + (item.walletTopupReward ?? 0)) * item.quantity : 0));
  // The donation product is sold in units of one euro.
  const donation = count(item => (item.uid === DONATION_UID ? item.quantity * item.price : 0));

  const holders = paid ? (transformTicketsFromOrder(paid) ?? []).flatMap(ticket => ticket.metadata?.ticketholders ?? []) : ["Ana Novak", "Bor Kos"];
  const holderLine = holders.length ? `${t.holders}: ${holders.join(", ")}.` : undefined;

  const rows: Row[] = [];
  if (weekend) rows.push({ title: t.weekend, amount: `${weekend}×`, note: t.tickets, extra: holderLine });
  if (evening) rows.push({ title: t.evening, amount: `${evening}×`, note: `${t.eveningNote} ${t.tickets}`, extra: weekend ? undefined : holderLine });
  if (tents) rows.push({ title: t.tent, amount: `${tents}×`, note: t.tentNote });
  if (bus) rows.push({ title: t.bus, amount: `${bus}×`, note: t.busNote });
  if (tokens) rows.push({ title: t.wallet, amount: `+${tokens} ǝŧ`, note: t.walletNote });
  if (donation) rows.push({ title: t.donation, amount: formatPrice(donation), note: t.donationNote });
  rows.push({ title: t.account, amount: "", note: t.accountNote });

  return (
    <main className={`${styles.root} ${styles.page} ${styles.thanksPage}`} lang={locale} data-inview="true">
      <BoilDefs />
      {paid ? (
        <PurchaseEvent
          orderId={paid.id}
          value={Number(paid.totalAmount)}
          contents={items.map(item => ({ id: item.uid, quantity: item.quantity, unitPrice: item.paidPrice ?? item.price, name: item.name, category: item.category }))}
        />
      ) : null}
      <div className={styles.inner}>
        <div className={styles.pageHead}>
          <Link href="/festival" className={styles.footLogo} aria-label="Endemit festival">
            <EndemitLogo />
          </Link>
          <Link href="/festival" className={styles.tag}>
            ← {t.back}
          </Link>
        </div>

        <h1 className={`${styles.display} ${styles.pageTitle} ${styles.boil}`}>{t.title}</h1>
        <p className={styles.thanksLede}>
          {t.paid(`#${order.id}`)}
          {order.email ? (
            <>
              {" "}
              {t.confirmation} <b>{order.email}</b>.
            </>
          ) : null}
        </p>

        <ul className={styles.thanks}>
          {rows.map(row => (
            <li key={row.title}>
              <h2>
                {row.title}
                {row.amount ? <b>{row.amount}</b> : null}
              </h2>
              <p>{row.note}</p>
              {row.extra ? <p className={styles.thanksExtra}>{row.extra}</p> : null}
            </li>
          ))}
        </ul>

        <div className={styles.thanksActions}>
          <Link href={`/profile/orders/${order.id}`} className={`${styles.tag} ${styles.tagSolid}`}>
            {t.order} →
          </Link>
          <Link href="/festival" className={styles.tag}>
            {t.back}
          </Link>
        </div>
      </div>

      {/* The camp is waiting. */}
      <div className={styles.thanksCamp} aria-hidden>
        <img className={styles.thanksTent} src={`${ART}/tent-1-520.webp`} width={520} height={370} alt="" style={{ left: "6%", width: "min(34vw, 300px)" }} />
        <img className={styles.imp} src={`${ART}/sprite-2-160.webp`} width={160} height={230} alt="" style={{ left: "44%", width: "min(7vw, 54px)", bottom: 6 }} />
        <img className={styles.thanksTent} src={`${ART}/tent-3-520.webp`} width={520} height={277} alt="" style={{ right: "4%", width: "min(30vw, 260px)" }} />
        <svg className={styles.campRidge} viewBox="0 0 100 40" preserveAspectRatio="none">
          <path d="M0,3 C12,7 22,1 35,4 S58,8 70,3 S90,1 100,5 V40 H0Z" />
        </svg>
      </div>

      <ClearFestivalBooking />
      {order.userId ? <AutoLoginOnSuccess userId={order.userId} /> : null}
    </main>
  );
}
