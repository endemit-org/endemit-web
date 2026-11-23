"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { useTranslations } from "next-intl";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { usePromoCodes } from "@/app/_hooks/usePromoCodes";
import { useWalletCredit } from "@/app/_hooks/useWalletCredit";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { getRoundedUpTotal } from "@/domain/checkout/actions/getRoundedUpTotal";
import { getSuggestedDonationAmount } from "@/domain/checkout/actions/getSuggestedDonationAmount";
import { isCutoffWithin48Hours, isProductSellableByCutoffDate } from "@/domain/product/businessLogic";
import type { Product } from "@/domain/product/types/product";
import { Link, useRouter } from "@/i18n/navigation";
import { PUBLIC_BASE_WEB_URL, PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/services/env/public";
import { getApiPath } from "@/lib/util/api";
import { formatTokensFromCents } from "@/lib/util/currency";
import { formatPrice } from "@/lib/util/formatting";
import type { FestivalLocale } from "./copy";
import type { FestivalOffer } from "./data";
import BoilDefs from "./BoilDefs";
import { BOOKING_STORAGE_KEY, bookingLines, linesTotal, MAX_PEOPLE, normalizeBooking, readBooking, writeBooking, type Booking, type BookingLine } from "./booking";
import { Stepper } from "./TicketBuilder";
import styles from "./festival.module.css";

const stripePromise = loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);

const text = {
  en: {
    title: "Checkout",
    back: "Back to the festival",
    order: "Your order",
    total: "Total",
    contact: "Where do the tickets go?",
    email: "Email",
    emailRepeat: "Repeat email",
    holders: "Who is coming?",
    holder: "Ticket holder",
    holderHint: "Name and surname",
    terms: "I accept the",
    termsLink: "terms and conditions",
    payment: "Payment",
    pay: "Pay",
    paying: "Processing",
    empty: "Nothing picked yet. Choose your tickets first.",
    closed: "Ticket sale is not open yet.",
    errEmail: "Enter a valid email.",
    errRepeat: "Emails do not match.",
    errHolder: "Add a name for every ticket.",
    errTerms: "Accept the terms to continue.",
    errGeneric: "Payment could not be started. Try again.",
    signedIn: "Signed in. Tickets go to this address.",
    steps: ["Cart", "Details", "Review and pay"],
    toDetails: "Continue",
    toReview: "Continue to review",
    stepBack: "Back",
    subtotal: "Subtotal",
    tickets: "Tickets",
    people: "People",
    tent: "Tent rental",
    bus: "Bus seats",
    topup: "Wallet top up",
    topupNone: "None",
    each: "each",
    less: "Less",
    more: "More",
    promoAdd: "I have a discount code",
    promoPlaceholder: "Code",
    promoApply: "Apply",
    promoApplying: "Checking",
    promoRemove: "Remove",
    promoClose: "No code",
    promoApplied: "Code",
    promoError: "This code does not work for this order.",
    discount: "Discount",
    walletUse: "Pay with my Wallet",
    walletAvailable: "Available",
    walletAmount: "From the Wallet",
    walletCard: "Left for the card",
    walletOnly: "The Wallet covers it all. No card needed.",
    donationTitle: "Donations keep us running",
    donationText: "We do all of this as volunteers. Round up and help keep ticket prices low.",
    donationAdd: "Add a donation of",
    donationSkip: "Not now",
    donationLine: "Donation",
    donationRemove: "Remove",
    demoBanner: "Demo: products are not published yet. Fill it in as a buyer would; no payment is made.",
    demoDone: "This is where the payment happens",
    demoSteps: [
      "The order is created and the card is charged through Stripe.",
      "The buyer lands on the confirmation page with the order summary.",
      "A confirmation email goes to the address above.",
      "Every ticket arrives with its own QR code and the holder's name.",
      "Tent and bus are on the same order; the Wallet top up is credited to the account.",
    ],
  },
  sl: {
    title: "Plačilo",
    back: "Nazaj na festival",
    order: "Tvoje naročilo",
    total: "Skop",
    contact: "Kam pošlemo karte?",
    email: "Mejl",
    emailRepeat: "Ponovi mejl",
    holders: "Kdo pride?",
    holder: "Imetnik karte",
    holderHint: "Ime pa priimek",
    terms: "Strinjam se s",
    termsLink: "splošnimi pogoji",
    payment: "Plačilo",
    pay: "Plačaj",
    paying: "Obdelujem",
    empty: "Nč še ni izbrano. Najprej izberi karte.",
    closed: "Prodaja kart še ni ofnana.",
    errEmail: "Vpiši veljavn mejl.",
    errRepeat: "Mejla se ne ujemata.",
    errHolder: "Vpiši ime za vsako karto.",
    errTerms: "Za naprej se mormo strinjat s pogoji.",
    errGeneric: "Plačila ni blo mogoče zagnat. Probi še enkrat.",
    signedIn: "Prijavlen si. Karte grejo na ta naslov.",
    steps: ["Košara", "Podatki", "Pregled pa plačilo"],
    toDetails: "Naprej",
    toReview: "Naprej na pregled",
    stepBack: "Nazaj",
    subtotal: "Vmesn seštevk",
    tickets: "Karte",
    people: "Ludi",
    tent: "Najem šotora",
    bus: "Sedeži na buso",
    topup: "Polnitev denarnce",
    topupNone: "Brez",
    each: "na kos",
    less: "Mn",
    more: "Več",
    promoAdd: "Mam kodo za popust",
    promoPlaceholder: "Koda",
    promoApply: "Uporabi",
    promoApplying: "Preverjam",
    promoRemove: "Odstrani",
    promoClose: "Brez kode",
    promoApplied: "Koda",
    promoError: "Ta koda za to naročilo ne vela.",
    discount: "Popust",
    walletUse: "Plačaj z Denarnco",
    walletAvailable: "Na voljo",
    walletAmount: "Iz Denarnce",
    walletCard: "Ostane za kartico",
    walletOnly: "Denarnca pokrije vse. Kartice ne rabiš.",
    donationTitle: "Donacije nas držijo pokonc",
    donationText: "Vse to delamo prostovoljno. Zaokroži pa pomagaj držat cene kart nizke.",
    donationAdd: "Dodaj donacijo",
    donationSkip: "Ne zdaj",
    donationLine: "Donacija",
    donationRemove: "Odstrani",
    demoBanner: "Demo: produkti še niso objavleni. Izpolni ko kupec; plačilo se ne izvede.",
    demoDone: "Tu se zgodi plačilo",
    demoSteps: [
      "Naročilo se ustvari, kartica se bremeni prek Stripa.",
      "Kupec pristane na strani s potrditvijo pa povzetkom naročila.",
      "Na zgornji mejl gre potrditev naročila.",
      "Vsaka karta pride s svojo QR kodo pa imenom imetnika.",
      "Šotor pa bus sta na istem naročilu; polnitev Denarnce se prpiše na račun.",
    ],
  },
} as const;

type Copy = (typeof text)[FestivalLocale];
type Holder = { field: string; label: string };

/** One name per issued ticket, keyed the way the checkout API expects. */
function holderFields(lines: BookingLine[], label: string): Holder[] {
  const holders: Holder[] = [];
  for (const { offer, quantity } of lines) {
    if (offer.kind !== "ticket") continue;
    const id = offer.product?.id ?? offer.key;
    const slots = quantity * offer.people;
    for (let slot = 1; slot <= slots; slot++) {
      holders.push({ field: `ticket-${id}-${slot}-name`, label: `${label} ${holders.length + 1}` });
    }
  }
  return holders;
}

type Wallet = ReturnType<typeof useWalletCredit>;
type Promo = ReturnType<typeof usePromoCodes>;

type FormProps = {
  lines: BookingLine[];
  holders: Holder[];
  t: Copy;
  userEmail: string;
  demo: boolean;
  /** Left for the card after discount and Wallet, in EUR. */
  payable: number;
  walletOnly: boolean;
  wallet: Wallet;
  promo: Promo;
  donation: { product: Product; quantity: number } | null;
  suggestion: { amount: number; rounded: number } | null;
  onDonate: (amount: number) => void;
  onSkipDonation: () => void;
  subTotal: number;
  discountAmount: number;
  offers: FestivalOffer[];
  booking: Booking;
  onBooking: (patch: Partial<Booking>) => void;
};

type Step = 1 | 2 | 3;

/** Wide screens show everything at once; phones go step by step. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 900px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return wide;
}

function CheckoutForm({ lines, holders, t, userEmail, demo, payable, walletOnly, wallet, promo, donation, suggestion, onDonate, onSkipDonation, subTotal, discountAmount, offers, booking, onBooking }: FormProps) {
  const consent = useTranslations("checkout.customer");
  const item = useTranslations("checkout.item");
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [email, setEmail] = useState(userEmail);
  const [emailRepeat, setEmailRepeat] = useState(userEmail);
  const [names, setNames] = useState<Record<string, string>>({});
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const wide = useWide();

  const signedIn = Boolean(userEmail);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const repeatValid = signedIn || email.trim().toLowerCase() === emailRepeat.trim().toLowerCase();
  const missingHolder = holders.some(holder => (names[holder.field] ?? "").trim().length < 2);
  const problem = !emailValid ? t.errEmail : !repeatValid ? t.errRepeat : missingHolder ? t.errHolder : !terms ? t.errTerms : "";
  const applied = promo.discount?.success ? promo.discount : null;
  const donationTotal = donation ? donation.product.price * donation.quantity : 0;

  const ticketLines = lines.filter(line => line.offer.kind === "ticket");
  const tent = offers.find(offer => offer.key === "tent" && offer.sellable);
  const bus = offers.find(offer => offer.key === "bus" && offer.sellable);
  const topups = offers.filter(offer => offer.kind === "topup" && offer.sellable);

  // Per-line notes, as in the shop cart: order limits and closing sales.
  const notes = lines.flatMap(({ offer, quantity }) => {
    const product = offer.product;
    if (!product) return [];
    const name = product.name;
    const limit = product.limits?.quantityLimit;
    if (limit && quantity > limit) return [{ key: `${offer.key}-limit`, blocking: true, text: `${name}: ${item("maxQuantity", { quantity: limit })}` }];
    if (!product.limits?.cutoffTimestamp) return [];
    if (!isProductSellableByCutoffDate(product)) return [{ key: `${offer.key}-gone`, blocking: true, text: `${name}: ${item("noLongerAvailable")}` }];
    if (!isCutoffWithin48Hours(product)) return [];
    const until = new Intl.DateTimeFormat(document.documentElement.lang || "sl", { dateStyle: "medium", timeStyle: "short" }).format(new Date(product.limits.cutoffTimestamp));
    return [{ key: `${offer.key}-until`, blocking: false, text: `${name}: ${item("availableUntil")} ${until}` }];
  });
  const blocked = notes.some(note => note.blocking);

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };
  // Details must be complete before the review step opens.
  const toReview = () => {
    setSubmitted(true);
    if (!problem) go(3);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setError("");
    if (problem || !stripe || !elements) return;
    // Demo stops here: the form was validated, no card is needed, nothing is sent.
    if (demo) {
      setDemoDone(true);
      return;
    }
    setBusy(true);

    if (!walletOnly) {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || t.errGeneric);
        setBusy(false);
        return;
      }
    }

    try {
      const complementaryTicketData = Object.fromEntries(holders.map(holder => [holder.field, names[holder.field].trim()]));
      const formData = {
        name: "",
        address: "",
        city: "",
        postalCode: "",
        country: "SI",
        phone: "",
        email: email.trim(),
        emailRepeat: signedIn ? email.trim() : emailRepeat.trim(),
        deliveryMethod: "PICKUP",
        pickupEventUid: "",
        termsAndConditions: true,
        subscribeToNewsletter: false,
        discountCodeId: applied?.promoCodeId,
        complementaryTicketData,
      };
      const { name, address, city, postalCode, country, phone } = formData;
      const items = lines.map(line => ({ ...line.offer.product, quantity: line.quantity }));
      if (donation) items.push({ ...donation.product, quantity: donation.quantity });
      const response = await fetch(getApiPath("checkout/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: formData.email,
          emailRepeat: formData.emailRepeat,
          complementaryTicketData,
          termsAndConditions: true,
          shippingAddress: { name, address, city, postalCode, country, phone },
          subscribeToNewsletter: false,
          formData,
          walletCreditAmount: wallet.walletCreditAmount,
          promoCode: applied ? promo.promoCodeValue : undefined,
          locale: document.documentElement.lang || "sl",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.orderId) throw new Error(result.error || t.errGeneric);

      if (result.fullWalletPayment) {
        sessionStorage.removeItem(BOOKING_STORAGE_KEY);
        router.push(`/store/checkout/success/${result.orderId}`);
        return;
      }

      const confirmation = await stripe.confirmPayment({
        elements,
        clientSecret: result.clientSecret,
        confirmParams: { return_url: `${PUBLIC_BASE_WEB_URL}/store/checkout/success/${result.paymentIntentId}` },
        redirect: "if_required",
      });
      if (confirmation.error) throw new Error(confirmation.error.message || t.errGeneric);
      if (confirmation.paymentIntent?.status === "succeeded") {
        sessionStorage.removeItem(BOOKING_STORAGE_KEY);
        router.push(`/store/checkout/success/${result.paymentIntentId}`);
        return;
      }
      setBusy(false);
    } catch (cause) {
      setError(cause instanceof Error && cause.message ? cause.message : t.errGeneric);
      setBusy(false);
    }
  };

  if (demoDone) {
    return (
      <div>
        <h2 className={`${styles.panelTitle} ${styles.boilSmall}`}>{t.demoDone}</h2>
        <ol className={styles.demoSteps}>
          {t.demoSteps.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <p className={styles.lede} style={{ marginTop: "1.4rem" }}>
          {email.trim()} · {holders.map(holder => names[holder.field].trim()).join(", ")}
        </p>
      </div>
    );
  }

  const orderLines = (
    <ul className={styles.summary}>
      {lines.map(line => (
        <li key={line.offer.key}>
          <span>
            {line.quantity}× {line.offer.product?.name ?? line.offer.label}
          </span>
          <span>{formatPrice(line.offer.price * line.quantity)}</span>
        </li>
      ))}
      {donation ? (
        <li>
          <span>
            {t.donationLine}{" "}
            <button type="button" className={styles.linkButton} onClick={() => onDonate(0)} disabled={busy}>
              {t.donationRemove}
            </button>
          </span>
          <span>{formatPrice(donationTotal)}</span>
        </li>
      ) : null}
    </ul>
  );

  return (
    <form onSubmit={submit} noValidate>
      <ol className={styles.steps} aria-hidden>
        {t.steps.map((label, i) => (
          <li key={label} data-state={step === i + 1 ? "now" : step > i + 1 ? "done" : "next"}>
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <div className={styles.checkoutGrid} data-step={step}>
        {/* ---- details: who buys, who comes ---- */}
        <section className={styles.stepInfo}>
          <h2 className={`${styles.panelTitle} ${styles.boilSmall}`}>{t.contact}</h2>
          <div className={styles.field}>
            <label htmlFor="fest-email">{t.email}</label>
            <input id="fest-email" type="email" autoComplete="email" inputMode="email" required readOnly={signedIn} value={email} onChange={e => setEmail(e.target.value)} aria-invalid={submitted && !emailValid} />
          </div>
          {signedIn ? (
            <p className={styles.fieldNote}>{t.signedIn}</p>
          ) : (
            <div className={styles.field}>
              <label htmlFor="fest-email-repeat">{t.emailRepeat}</label>
              <input id="fest-email-repeat" type="email" autoComplete="email" inputMode="email" required value={emailRepeat} onChange={e => setEmailRepeat(e.target.value)} aria-invalid={submitted && !repeatValid} />
            </div>
          )}

          <h2 className={`${styles.panelTitle} ${styles.boilSmall}`}>{t.holders}</h2>
          {holders.map(holder => (
            <div key={holder.field} className={styles.field}>
              <label htmlFor={holder.field}>{holder.label}</label>
              <input
                id={holder.field}
                type="text"
                autoComplete="off"
                placeholder={t.holderHint}
                required
                value={names[holder.field] ?? ""}
                onChange={e => setNames(current => ({ ...current, [holder.field]: e.target.value }))}
                aria-invalid={submitted && (names[holder.field] ?? "").trim().length < 2}
              />
            </div>
          ))}

          <label className={styles.check}>
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
            <span className={styles.consent}>
              <span>
                {consent.rich("consent.terms", {
                  terms: chunks => <Link href="/terms-and-conditions" target="_blank">{chunks}</Link>,
                  privacy: chunks => <Link href="/privacy-policy" target="_blank">{chunks}</Link>,
                  withdrawal: chunks => <Link href="/right-to-withdrawal" target="_blank">{chunks}</Link>,
                })}
              </span>
              <span>
                {consent.rich("consent.nonRefundable", {
                  notice: chunks => <Link href="/notice-on-purchase-of-digital-products" target="_blank">{chunks}</Link>,
                })}
              </span>
              <span>
                {consent.rich("consent.codeOfConduct", {
                  code: chunks => <Link href="/code-of-conduct" target="_blank">{chunks}</Link>,
                })}
              </span>
            </span>
          </label>
          {submitted && problem ? <p className={styles.error} role="alert">{problem}</p> : null}

          <div className={styles.stepNav}>
            <button type="button" className={`${styles.tag} ${styles.tagSolid}`} onClick={toReview}>
              {t.toReview} →
            </button>
            <button type="button" className={styles.linkButton} onClick={() => go(1)}>
              ← {t.stepBack}
            </button>
          </div>
        </section>

        <aside>
          {/* ---- cart ---- */}
          <section className={styles.stepCart}>
            <h2 className={`${styles.panelTitle} ${styles.boilSmall}`}>{t.order}</h2>
            <div className={styles.cart}>
              <div className={styles.cartRow}>
                <div>
                  <b>{t.tickets}</b> · {formatPrice(linesTotal(ticketLines))}
                  <small>
                    {ticketLines.map((line, i) => `${i > 0 ? " + " : ""}${line.quantity}× ${line.offer.label}`).join("")}
                  </small>
                </div>
                <Stepper value={booking.people} min={1} max={MAX_PEOPLE} onChange={people => onBooking({ people })} label={t.people} less={t.less} more={t.more} />
              </div>
              {tent ? (
                <div className={styles.cartRow}>
                  <div>
                    <b>{t.tent}</b> · {formatPrice(tent.price * booking.tents)}
                    <small>
                      {formatPrice(tent.price)} {t.each}
                    </small>
                  </div>
                  <Stepper value={booking.tents} min={0} max={booking.people} onChange={tents => onBooking({ tents })} label={t.tent} less={t.less} more={t.more} />
                </div>
              ) : null}
              {bus ? (
                <div className={styles.cartRow}>
                  <div>
                    <b>{t.bus}</b> · {formatPrice(bus.price * booking.bus)}
                    <small>
                      Ljubljana – Libeliče – Ljubljana · {formatPrice(bus.price)} {t.each}
                    </small>
                  </div>
                  <Stepper value={booking.bus} min={0} max={booking.people} onChange={value => onBooking({ bus: value })} label={t.bus} less={t.less} more={t.more} />
                </div>
              ) : null}
              {topups.length ? (
                <div className={styles.cartRow} style={{ flexWrap: "wrap" }}>
                  <div>
                    <b>{t.topup}</b>
                  </div>
                  <div className={styles.chips}>
                    <button type="button" className={styles.chip} aria-pressed={booking.topup === null} onClick={() => onBooking({ topup: null })}>
                      {t.topupNone}
                    </button>
                    {topups.map(offer => (
                      <button key={offer.key} type="button" className={styles.chip} aria-pressed={booking.topup === offer.key} onClick={() => onBooking({ topup: offer.key })}>
                        {offer.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {donation ? (
                <div className={styles.cartRow}>
                  <div>
                    <b>{t.donationLine}</b> · {formatPrice(donationTotal)}
                  </div>
                  <button type="button" className={styles.linkButton} onClick={() => onDonate(0)}>
                    {t.donationRemove}
                  </button>
                </div>
              ) : null}
            </div>
            {notes.map(note => (
              <p key={note.key} className={note.blocking ? styles.error : styles.notice}>
                {note.text}
              </p>
            ))}

            {suggestion ? (
              <div className={styles.donation}>
                <h3>{t.donationTitle}</h3>
                <p>{t.donationText}</p>
                <div className={styles.donationActions}>
                  <button type="button" className={`${styles.tag} ${styles.tagSolid}`} 
                    onClick={async event => {
                      onDonate(suggestion.amount);
                      const origin = { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight };
                      const confetti = (await import("canvas-confetti")).default;
                      confetti({ particleCount: 50, spread: 50, origin, colors: ["#f4a78f", "#ee3b4f", "#a99bea", "#ffd23f"] });
                    }}
                    disabled={busy}
                  >
                    {t.donationAdd} {formatPrice(suggestion.amount)} → {formatPrice(suggestion.rounded)}
                  </button>
                  <button type="button" className={styles.linkButton} onClick={onSkipDonation}>
                    {t.donationSkip}
                  </button>
                </div>
              </div>
            ) : null}

            <div className={`${styles.total} ${styles.stepOnly}`}>
              <span className={styles.rowLabel}>{t.subtotal}</span>
              <span className={`${styles.totalSum} ${styles.boilSmall}`}>{formatPrice(subTotal)}</span>
            </div>
            {/* A code that arrived with the link shows its effect on the first step already. */}
            {discountAmount !== 0 ? (
              <div className={styles.stepOnly}>
                <p className={styles.extraRow}>
                  <span>
                    {t.discount} {applied ? <b>{applied.promoCodeKey}</b> : null}
                  </span>
                  <span>{formatPrice(discountAmount)}</span>
                </p>
                <p className={styles.extraRow}>
                  <b>{t.total}</b>
                  <b>{formatPrice(subTotal + discountAmount)}</b>
                </p>
              </div>
            ) : null}
            <div className={styles.stepNav}>
              <button type="button" className={`${styles.tag} ${styles.tagSolid}`} onClick={() => go(2)}>
                {t.toDetails} →
              </button>
            </div>
          </section>

          {/* ---- review and pay ---- */}
          <section className={styles.stepPay}>
            <details className={styles.recap}>
              <summary>
                {t.order} · {formatPrice(subTotal)}
              </summary>
              {orderLines}
            </details>

            <ul className={styles.summary}>
              {discountAmount !== 0 ? (
                <li>
                  <span>{t.discount}</span>
                  <span>{formatPrice(discountAmount)}</span>
                </li>
              ) : null}
              {wallet.isUsingWallet ? (
                <li>
                  <span>{t.walletAmount}</span>
                  <span>−{formatTokensFromCents(wallet.walletCreditAmount)}</span>
                </li>
              ) : null}
            </ul>
            <div className={styles.total}>
              <span className={styles.rowLabel}>{t.total}</span>
              <span className={`${styles.totalSum} ${styles.boilSmall}`}>{formatPrice(payable)}</span>
            </div>

            {applied ? (
              <p className={styles.extraRow}>
                <span>
                  {t.promoApplied} <b>{applied.promoCodeKey}</b>
                </span>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    promo.removePromoCode();
                    setPromoOpen(false);
                  }}
                  disabled={busy}
                >
                  {t.promoRemove}
                </button>
              </p>
            ) : promoOpen || promo.error ? (
              <>
                <div className={styles.promo}>
                  <input
                    type="text"
                    aria-label={t.promoPlaceholder}
                    placeholder={t.promoPlaceholder}
                    autoComplete="off"
                    autoCapitalize="characters"
                    value={promo.promoCodeValue}
                    onChange={e => promo.setPromoCodeValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void promo.applyPromoCode();
                      }
                    }}
                  />
                  <button type="button" className={styles.tag} onClick={() => void promo.applyPromoCode()} disabled={promo.isLoading || !promo.promoCodeValue.trim()}>
                    {promo.isLoading ? t.promoApplying : t.promoApply}
                  </button>
                </div>
                {promo.error ? <p className={styles.error} role="alert">{t.promoError}</p> : null}
                <p className={`${styles.extraRow} ${styles.rowEnd}`}>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => {
                      promo.removePromoCode();
                      setPromoOpen(false);
                    }}
                  >
                    {t.promoClose}
                  </button>
                </p>
              </>
            ) : (
              <p className={`${styles.extraRow} ${styles.rowEnd}`}>
                <button type="button" className={styles.linkButton} onClick={() => setPromoOpen(true)}>
                  {t.promoAdd}
                </button>
              </p>
            )}

            {wallet.canUseWallet ? (
              <div className={styles.walletBox}>
                <label className={styles.check} style={{ marginTop: 0 }}>
                  <input type="checkbox" checked={wallet.isUsingWallet} onChange={wallet.toggleWalletCredit} disabled={busy} />
                  <span>
                    <b>{t.walletUse}</b>
                    <br />
                    {t.walletAvailable}: {formatTokensFromCents(wallet.walletBalance)}
                  </span>
                </label>
                {wallet.isUsingWallet ? (
                  <>
                    {wallet.maxWalletCredit > 100 ? (
                      <input
                        type="range"
                        aria-label={t.walletAmount}
                        min={100}
                        max={wallet.maxWalletCredit}
                        step={1}
                        value={wallet.walletCreditAmount || 100}
                        onChange={e => wallet.setWalletCreditAmount(parseInt(e.target.value, 10))}
                        disabled={busy}
                      />
                    ) : null}
                    <p className={styles.extraRow}>
                      <span>{t.walletCard}</span>
                      <span>{formatPrice(payable)}</span>
                    </p>
                  </>
                ) : null}
              </div>
            ) : null}

            {walletOnly ? (
              <p className={styles.notice}>{t.walletOnly}</p>
            ) : wide || step === 3 ? (
              // Mounted only while visible: the card field needs real size to lay out.
              <div className={styles.stripe}>
                <PaymentElement
                  onReady={() => setReady(true)}
                  options={{ layout: "tabs", paymentMethodOrder: ["apple_pay", "card", "google_pay"], wallets: { applePay: "auto", googlePay: "auto" } }}
                />
              </div>
            ) : null}

            {submitted && problem ? <p className={`${styles.error} ${styles.wideOnly}`} role="alert">{problem}</p> : null}
            {error ? <p className={styles.error} role="alert">{error}</p> : null}

            <div className={styles.payNav}>
              <button type="submit" className={`${styles.tag} ${styles.tagSolid}`} disabled={busy || blocked || !stripe || (!walletOnly && !ready)}>
                {busy ? t.paying : `${t.pay} ${formatPrice(payable)}`}
              </button>
              <button type="button" className={`${styles.linkButton} ${styles.stepOnly}`} onClick={() => go(2)} disabled={busy}>
                ← {t.stepBack}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </form>
  );
}

export default function FestivalCheckout({
  locale,
  offers,
  salesOpen,
  demo = false,
  userEmail,
  donationProduct = null,
}: {
  locale: FestivalLocale;
  offers: FestivalOffer[];
  salesOpen: boolean;
  demo?: boolean;
  userEmail: string;
  donationProduct?: Product | null;
}) {
  const t = text[locale];
  const [booking, setBooking] = useState<Booking | null>(null);
  const [donationQuantity, setDonationQuantity] = useState(0);
  const [donationSkipped, setDonationSkipped] = useState(false);

  const [loaded, setLoaded] = useState(false);
  // Shareable link: /festival/checkout?people=4&tents=2&bus=4&topup=50&code=FRIENDS20
  // The link is an entry point, not state: it is read once and stripped from the URL.
  const [linkCode, setLinkCode] = useState("");
  useEffect(() => {
    const url = new URL(window.location.href);
    const query = url.searchParams;
    const number = (name: string) => Number.parseInt(query.get(name) ?? "", 10);
    let next = readBooking();
    if (Number.isFinite(number("people"))) {
      next = normalizeBooking({
        people: number("people"),
        tents: number("tents") || 0,
        bus: number("bus") || 0,
        topup: query.get("topup") ? `topup-${query.get("topup")}` : null,
      });
      writeBooking(next);
    }
    setBooking(next);
    setLoaded(true);
    setLinkCode((query.get("code") ?? "").trim().toUpperCase());
    if (["people", "tents", "bus", "topup", "code"].some(name => query.has(name))) {
      for (const name of ["people", "tents", "bus", "topup", "code"]) query.delete(name);
      window.history.replaceState(window.history.state, "", url);
    }
  }, []);

  // The cart stays editable here, under the same rules as on the festival page.
  const updateBooking = (patch: Partial<Booking>) =>
    setBooking(current => {
      if (!current) return current;
      const next = { ...current, ...patch };
      next.tents = Math.min(next.tents, next.people);
      next.bus = Math.min(next.bus, next.people);
      writeBooking(next);
      return next;
    });

  // Only lines backed by a published, sellable product can be paid for.
  const lines = useMemo(
    () => (booking ? bookingLines(offers, booking).filter(line => (demo || line.offer.product) && line.offer.sellable) : []),
    [booking, offers, demo]
  );
  const holders = useMemo(() => holderFields(lines, t.holder), [lines, t.holder]);
  const hasTicket = holders.length > 0;

  const donation = useMemo(
    () => (donationProduct && donationQuantity > 0 ? { product: donationProduct, quantity: donationQuantity } : null),
    [donationProduct, donationQuantity]
  );
  const cartItems = useMemo(
    () => [
      ...lines.map(line => ({ uid: line.offer.uid, price: line.offer.price, quantity: line.quantity })),
      ...(donation ? [{ uid: donation.product.uid, price: donation.product.price, quantity: donation.quantity }] : []),
    ],
    [lines, donation]
  );
  const subTotal = linesTotal(lines) + (donation ? donation.product.price * donation.quantity : 0);

  const promo = usePromoCodes(cartItems, subTotal, 0);
  // The code from the link is applied in a second pass: validation needs the
  // cart total and the code to have landed in state first.
  const { promoCodeValue, setPromoCodeValue, applyPromoCode } = promo;
  const [linkCodeApplied, setLinkCodeApplied] = useState(false);
  useEffect(() => {
    if (!linkCode || linkCodeApplied || subTotal <= 0) return;
    if (promoCodeValue !== linkCode) {
      setPromoCodeValue(linkCode);
      return;
    }
    setLinkCodeApplied(true);
    void applyPromoCode();
  }, [linkCode, linkCodeApplied, subTotal, promoCodeValue, setPromoCodeValue, applyPromoCode]);
  const totals = getCheckoutTotals({ subTotal, discount: promo.discount, shippingCost: 0, items: cartItems });
  // Same rule as the shop: Wallet credit cannot buy a Wallet top up.
  const hasTopup = lines.some(line => line.offer.kind === "topup");
  const wallet = useWalletCredit({ total: totals.total, enabled: lines.length > 0 && !hasTopup });

  const totalCents = Math.round(totals.total * 100);
  const payableCents = Math.max(0, totalCents - wallet.walletCreditAmount);
  const walletOnly = wallet.isUsingWallet && payableCents === 0;

  // Offer to round the total up, as the shop checkout does.
  const rounded = getRoundedUpTotal(totals.total);
  const suggested = getSuggestedDonationAmount(rounded, totals.total);
  const suggestion =
    donationProduct && !donation && !donationSkipped && suggested > 0 && !wallet.isLoading && !wallet.canUseWallet && totals.total > 0
      ? { amount: suggested, rounded }
      : null;

  const options: StripeElementsOptions = {
    mode: "payment",
    // Stripe needs a positive amount even while the Wallet covers everything.
    amount: Math.max(payableCents, 100),
    currency: "eur",
    locale,
    appearance: {
      theme: "night",
      labels: "above",
      variables: {
        colorPrimary: "#f4a78f",
        colorBackground: "#040612",
        colorText: "#f6e9df",
        colorDanger: "#ee3b4f",
        borderRadius: "0px",
        fontFamily: "system-ui, sans-serif",
      },
    },
  };

  return (
    <main className={`${styles.root} ${styles.page}`} lang={locale} data-inview="true">
      <BoilDefs />
      <div className={styles.inner}>
        <div className={styles.pageHead}>
          <Link href="/festival" className={styles.footLogo} aria-label="Endemit festival">
            <EndemitLogo />
          </Link>
          <Link href="/festival#tickets" className={styles.tag}>
            ← {t.back}
          </Link>
        </div>
        <h1 className={`${styles.display} ${styles.pageTitle} ${styles.boil}`}>{t.title}</h1>
        {demo ? <p className={styles.notice}>{t.demoBanner}</p> : null}

        {!loaded ? null : !salesOpen || !booking || !hasTicket || subTotal <= 0 ? (
          <p className={styles.lede} style={{ marginTop: "2rem" }}>
            {salesOpen ? t.empty : t.closed}
          </p>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              lines={lines}
              holders={holders}
              t={t}
              userEmail={userEmail}
              demo={demo}
              payable={payableCents / 100}
              walletOnly={walletOnly}
              wallet={wallet}
              promo={promo}
              donation={donation}
              suggestion={suggestion}
              onDonate={setDonationQuantity}
              onSkipDonation={() => setDonationSkipped(true)}
              subTotal={subTotal}
              discountAmount={totals.discountAmount}
              offers={offers}
              booking={booking}
              onBooking={updateBooking}
            />
          </Elements>
        )}
      </div>
    </main>
  );
}
