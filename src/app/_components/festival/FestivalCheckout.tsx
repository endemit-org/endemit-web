"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { Link, useRouter } from "@/i18n/navigation";
import { PUBLIC_BASE_WEB_URL, PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/services/env/public";
import { getApiPath } from "@/lib/util/api";
import { formatPrice } from "@/lib/util/formatting";
import type { FestivalLocale } from "./copy";
import type { FestivalOffer } from "./data";
import { bookingLines, linesTotal, readBooking, type BookingLine } from "./booking";
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

function CheckoutForm({ lines, total, holders, t, userEmail, demo }: { lines: BookingLine[]; total: number; holders: Holder[]; t: Copy; userEmail: string; demo: boolean }) {
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

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const repeatValid = email.trim().toLowerCase() === emailRepeat.trim().toLowerCase();
  const missingHolder = holders.some(holder => (names[holder.field] ?? "").trim().length < 2);
  const problem = !emailValid ? t.errEmail : !repeatValid ? t.errRepeat : missingHolder ? t.errHolder : !terms ? t.errTerms : "";

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

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || t.errGeneric);
      setBusy(false);
      return;
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
        emailRepeat: emailRepeat.trim(),
        deliveryMethod: "PICKUP",
        pickupEventUid: "",
        termsAndConditions: true,
        subscribeToNewsletter: false,
        complementaryTicketData,
      };
      const { name, address, city, postalCode, country, phone } = formData;
      const response = await fetch(getApiPath("checkout/create-payment-intent"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map(line => ({ ...line.offer.product, quantity: line.quantity })),
          email: formData.email,
          emailRepeat: formData.emailRepeat,
          complementaryTicketData,
          termsAndConditions: true,
          shippingAddress: { name, address, city, postalCode, country, phone },
          subscribeToNewsletter: false,
          formData,
          walletCreditAmount: 0,
          locale: document.documentElement.lang || "sl",
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.orderId) throw new Error(result.error || t.errGeneric);

      if (result.fullWalletPayment) {
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
        <h2 className={styles.panelTitle}>{t.demoDone}</h2>
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

  return (
    <form onSubmit={submit} noValidate>
      <h2 className={styles.panelTitle}>{t.contact}</h2>
      <div className={styles.field}>
        <label htmlFor="fest-email">{t.email}</label>
        <input id="fest-email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)} aria-invalid={submitted && !emailValid} />
      </div>
      <div className={styles.field}>
        <label htmlFor="fest-email-repeat">{t.emailRepeat}</label>
        <input id="fest-email-repeat" type="email" autoComplete="email" inputMode="email" required value={emailRepeat} onChange={e => setEmailRepeat(e.target.value)} aria-invalid={submitted && !repeatValid} />
      </div>

      <h2 className={styles.panelTitle}>{t.holders}</h2>
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

      <h2 className={styles.panelTitle}>{t.payment}</h2>
      <div className={styles.stripe}>
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs", paymentMethodOrder: ["apple_pay", "card", "google_pay"], wallets: { applePay: "auto", googlePay: "auto" } }}
        />
      </div>

      <label className={styles.check}>
        <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
        <span>
          {t.terms}{" "}
          <Link href="/terms-and-conditions" target="_blank">
            {t.termsLink}
          </Link>
        </span>
      </label>

      {submitted && problem ? <p className={styles.error} role="alert">{problem}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <p style={{ marginTop: "1.6rem" }}>
        <button type="submit" className={`${styles.tag} ${styles.tagSolid}`} disabled={busy || !stripe || !ready}>
          {busy ? t.paying : `${t.pay} ${formatPrice(total)}`}
        </button>
      </p>
    </form>
  );
}

export default function FestivalCheckout({
  locale,
  offers,
  salesOpen,
  demo = false,
  userEmail,
}: {
  locale: FestivalLocale;
  offers: FestivalOffer[];
  salesOpen: boolean;
  demo?: boolean;
  userEmail: string;
}) {
  const t = text[locale];
  const [lines, setLines] = useState<BookingLine[] | null>(null);

  useEffect(() => {
    const booking = readBooking();
    // Only lines backed by a published, sellable product can be paid for.
    setLines(booking ? bookingLines(offers, booking).filter(line => (demo || line.offer.product) && line.offer.sellable) : []);
  }, [offers, demo]);

  const total = lines ? linesTotal(lines) : 0;
  const holders = useMemo(() => (lines ? holderFields(lines, t.holder) : []), [lines, t.holder]);
  const hasTicket = holders.length > 0;

  const options: StripeElementsOptions = {
    mode: "payment",
    amount: Math.round(total * 100),
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
    <main className={`${styles.root} ${styles.page}`} lang={locale}>
      <div className={styles.inner}>
        <div className={styles.pageHead}>
          <Link href="/festival" className={styles.footLogo} aria-label="Endemit festival">
            <EndemitLogo />
          </Link>
          <Link href="/festival#tickets" className={styles.tag}>
            ← {t.back}
          </Link>
        </div>
        <h1 className={`${styles.display} ${styles.pageTitle}`}>{t.title}</h1>
        {demo ? <p className={styles.notice}>{t.demoBanner}</p> : null}

        {lines === null ? null : !salesOpen || !hasTicket || total <= 0 ? (
          <p className={styles.lede} style={{ marginTop: "2rem" }}>
            {salesOpen ? t.empty : t.closed}
          </p>
        ) : (
          <div className={styles.checkoutGrid} style={{ marginTop: "2.4rem" }}>
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm lines={lines} total={total} holders={holders} t={t} userEmail={userEmail} demo={demo} />
            </Elements>
            <aside>
              <h2 className={styles.panelTitle}>{t.order}</h2>
              <ul className={styles.summary}>
                {lines.map(line => (
                  <li key={line.offer.key}>
                    <span>
                      {line.quantity}× {line.offer.product?.name ?? line.offer.label}
                    </span>
                    <span>{formatPrice(line.offer.price * line.quantity)}</span>
                  </li>
                ))}
              </ul>
              <div className={styles.total}>
                <span className={styles.rowLabel}>{t.total}</span>
                <span className={styles.totalSum}>{formatPrice(total)}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
