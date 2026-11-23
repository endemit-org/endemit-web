"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { usePromoCodes } from "@/app/_hooks/usePromoCodes";
import { useWalletCredit } from "@/app/_hooks/useWalletCredit";
import { getCheckoutTotals } from "@/domain/checkout/actions/getCheckoutTotals";
import { getRoundedUpTotal } from "@/domain/checkout/actions/getRoundedUpTotal";
import { getSuggestedDonationAmount } from "@/domain/checkout/actions/getSuggestedDonationAmount";
import type { Product } from "@/domain/product/types/product";
import { Link, useRouter } from "@/i18n/navigation";
import { PUBLIC_BASE_WEB_URL, PUBLIC_STRIPE_PUBLISHABLE_KEY } from "@/lib/services/env/public";
import { getApiPath } from "@/lib/util/api";
import { formatTokensFromCents } from "@/lib/util/currency";
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
    signedIn: "Signed in. Tickets go to this address.",
    promoAdd: "I have a discount code",
    promoPlaceholder: "Code",
    promoApply: "Apply",
    promoApplying: "Checking",
    promoRemove: "Remove",
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
    promoAdd: "Mam kodo za popust",
    promoPlaceholder: "Koda",
    promoApply: "Uporabi",
    promoApplying: "Preverjam",
    promoRemove: "Odstrani",
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
};

function CheckoutForm({ lines, holders, t, userEmail, demo, payable, walletOnly, wallet, promo, donation, suggestion, onDonate, onSkipDonation }: FormProps) {
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

  const signedIn = Boolean(userEmail);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const repeatValid = signedIn || email.trim().toLowerCase() === emailRepeat.trim().toLowerCase();
  const missingHolder = holders.some(holder => (names[holder.field] ?? "").trim().length < 2);
  const problem = !emailValid ? t.errEmail : !repeatValid ? t.errRepeat : missingHolder ? t.errHolder : !terms ? t.errTerms : "";
  const applied = promo.discount?.success ? promo.discount : null;

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

      {suggestion ? (
        <div className={styles.donation}>
          <h3>{t.donationTitle}</h3>
          <p>{t.donationText}</p>
          <div className={styles.donationActions}>
            <button type="button" className={`${styles.tag} ${styles.tagSolid}`} onClick={() => onDonate(suggestion.amount)} disabled={busy}>
              {t.donationAdd} {formatPrice(suggestion.amount)} → {formatPrice(suggestion.rounded)}
            </button>
            <button type="button" className={styles.linkButton} onClick={onSkipDonation}>
              {t.donationSkip}
            </button>
          </div>
        </div>
      ) : null}

      <h2 className={styles.panelTitle}>{t.payment}</h2>

      {applied ? (
        <p className={styles.extraRow}>
          <span>
            {t.promoApplied} <b>{applied.promoCodeKey}</b>
          </span>
          <button type="button" className={styles.linkButton} onClick={promo.removePromoCode} disabled={busy}>
            {t.promoRemove}
          </button>
        </p>
      ) : promoOpen ? (
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
        </>
      ) : (
        <p className={styles.extraRow}>
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
                <span>{t.walletAmount}</span>
                <span>−{formatTokensFromCents(wallet.walletCreditAmount)}</span>
              </p>
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
      ) : (
        <div className={styles.stripe}>
          <PaymentElement
            onReady={() => setReady(true)}
            options={{ layout: "tabs", paymentMethodOrder: ["apple_pay", "card", "google_pay"], wallets: { applePay: "auto", googlePay: "auto" } }}
          />
        </div>
      )}

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
        <button type="submit" className={`${styles.tag} ${styles.tagSolid}`} disabled={busy || !stripe || (!walletOnly && !ready)}>
          {busy ? t.paying : `${t.pay} ${formatPrice(payable)}`}
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
  const [loaded, setLoaded] = useState<BookingLine[] | null>(null);
  const [donationQuantity, setDonationQuantity] = useState(0);
  const [donationSkipped, setDonationSkipped] = useState(false);

  useEffect(() => {
    const booking = readBooking();
    // Only lines backed by a published, sellable product can be paid for.
    setLoaded(booking ? bookingLines(offers, booking).filter(line => (demo || line.offer.product) && line.offer.sellable) : []);
  }, [offers, demo]);

  const lines = useMemo(() => loaded ?? [], [loaded]);
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
  const donationTotal = donation ? donation.product.price * donation.quantity : 0;
  const subTotal = linesTotal(lines) + donationTotal;

  const promo = usePromoCodes(cartItems, subTotal, 0);
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

        {loaded === null ? null : !salesOpen || !hasTicket || subTotal <= 0 ? (
          <p className={styles.lede} style={{ marginTop: "2rem" }}>
            {salesOpen ? t.empty : t.closed}
          </p>
        ) : (
          <div className={styles.checkoutGrid} style={{ marginTop: "2.4rem" }}>
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
              />
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
                {donation ? (
                  <li>
                    <span>
                      {t.donationLine}{" "}
                      <button type="button" className={styles.linkButton} onClick={() => setDonationQuantity(0)}>
                        {t.donationRemove}
                      </button>
                    </span>
                    <span>{formatPrice(donationTotal)}</span>
                  </li>
                ) : null}
                {totals.discountAmount !== 0 ? (
                  <li>
                    <span>{t.discount}</span>
                    <span>{formatPrice(totals.discountAmount)}</span>
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
                <span className={styles.totalSum}>{formatPrice(payableCents / 100)}</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
