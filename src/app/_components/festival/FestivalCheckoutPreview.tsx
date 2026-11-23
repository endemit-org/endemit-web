"use client";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { useEffect, useRef, useState } from "react";
import {
  bookingKey,
  bookingTotals,
  initialBooking,
  money,
  formatCredit,
  normalizeBooking,
  type Booking,
} from "./booking";
import baseStyles from "./editorial.module.css";
import b from "./booking.module.css";
const s = Object.fromEntries(
  Object.entries(baseStyles).map(([name, value]) => [
    name,
    [value, b[name]].filter(Boolean).join(" "),
  ])
);

export default function FestivalCheckoutPreview({
  locale,
}: {
  locale: "en" | "sl";
}) {
  const sl = locale === "sl",
    base = sl ? "/festival" : "/en/festival";
  const [booking, setBooking] = useState<Booking>(initialBooking),
    [loaded, setLoaded] = useState(false),
    [step, setStep] = useState(1);
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [sameName, setSameName] = useState(true),
    [holders, setHolders] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(bookingKey);
      if (saved) setBooking(normalizeBooking(JSON.parse(saved)));
    } catch {}
    setLoaded(true);
  }, []);
  const totals = bookingTotals(booking),
    price = (n: number) => money(n, locale);
  const names = Array.from({ length: totals.people }, (_, i) =>
    sameName ? name : holders[i] || ""
  );
  const move = (next: number) => {
    setStep(next);
    requestAnimationFrame(() => {
      heading.current?.focus();
      scrollTo({ top: 0, behavior: "instant" });
    });
  };
  return (
    <div className={`${s.experience} ${b.booking} light-scheme`}>
      <main className={s.checkoutShell}>
        <header className={s.header}>
          <a href={base} className={s.wordmark}>
            <span className={s.srOnly}>Endemit</span>
            <EndemitLogo />
          </a>
          <a href={base + "#tickets"} className={s.checkoutBack}>
            {sl ? "← Nazaj na izbiro" : "← Back to your selection"}
          </a>
          <div className={s.languages} style={{ marginLeft: "auto" }}>
            {(["sl", "en"] as const).map(l => (
              <a
                key={l}
                href={`${l === "en" ? "/en" : ""}/festival/checkout`}
                hrefLang={l}
                lang={l}
                aria-current={locale === l ? "true" : undefined}
                onClick={() => {
                  document.cookie = `ENDEMIT_LOCALE=${l};path=/;max-age=31536000;SameSite=Lax`;
                }}
              >
                {l}
              </a>
            ))}
          </div>
        </header>
        <p className={s.kicker}>ENDEMIT / 13—15.08.2027</p>
        <h1 ref={heading} tabIndex={-1}>
          {sl ? "Tvoj vikend v šumi." : "Your weekend in the forest."}
        </h1>
        <p className={s.previewNote}>
          {sl
            ? "Predogled nakupa · cene so vzorčne. Podatki se ne pošljejo, plačilo se ne izvede."
            : "Purchase preview · prices are illustrative. Details are not submitted and no payment is taken."}
        </p>
        {!loaded ? (
          <p role="status">
            {sl ? "Nalagam izbiro…" : "Loading your selection…"}
          </p>
        ) : step === 3 ? (
          <div className={s.success}>
            <span aria-hidden="true">✦</span>
            <p className={s.kicker}>
              {sl ? "PREDOGLED ZAKLJUČEN" : "PREVIEW COMPLETE"}
            </p>
            <h2>
              {sl ? "Tk bi se začel" : "This is where"}
              <br />
              {sl ? "tvoj mali pobeg." : "your escape begins."}
            </h2>
            <p>
              {sl
                ? "Prikazan je konec nakupnega poteka. Naročilo ni bilo ustvarjeno, karta ni bila izdana in nič ni bilo zaračunano."
                : "You’ve reached the end of the purchase preview. No order was created, no ticket was issued, and nothing was charged."}
            </p>
            <div className={s.reviewBlock}>
              <p>
                {totals.people} × {sl ? "festivalska karta" : "festival pass"}
              </p>
              {booking.tents > 0 && (
                <p>
                  {booking.tents} ×{" "}
                  {sl ? "šotor za dve osebi" : "two-person tent"}
                </p>
              )}
              {booking.transport > 0 && (
                <p>
                  {booking.transport} ×{" "}
                  {sl ? "povratni prevoz" : "return transport"}
                </p>
              )}
              {booking.credit > 0 && (
                <p>
                  {price(booking.credit)} →{" "}
                  {formatCredit(totals.walletCredit, locale)} ·{" "}
                  {sl
                    ? "denarnca z 10 % bonusa"
                    : "wallet credit including 10% bonus"}
                </p>
              )}
              <strong>
                {price(totals.total)} · {sl ? "vzorčni znesek" : "sample total"}
              </strong>
            </div>
            <a className={s.primaryButton} href={base}>
              {sl ? "Nazaj med zvezde" : "Back to the stars"} ↗
            </a>
          </div>
        ) : (
          <div className={s.checkoutLayout}>
            <div className={s.checkoutForm}>
              <nav
                className={s.checkoutSteps}
                aria-label={sl ? "Koraki rezervacije" : "Booking steps"}
              >
                <span aria-current={step === 1 ? "step" : undefined}>
                  01 / {sl ? "Podatki" : "Your details"}
                </span>
                <span aria-current={step === 2 ? "step" : undefined}>
                  02 / {sl ? "Pregled" : "Review"}
                </span>
                <span>03 / {sl ? "Potrditev" : "Confirmation"}</span>
              </nav>
              {step === 1 ? (
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    move(2);
                  }}
                >
                  <h2>{sl ? "Kdo pride z nami?" : "Who’s joining us?"}</h2>
                  <label className={b.paperField}>
                    {sl ? "Ime in priimek kupca" : "Buyer’s full name"}
                    <input
                      placeholder={
                        sl ? "Tvoje ime in priimek" : "Your first and last name"
                      }
                      name="buyerName"
                      autoComplete="name"
                      required
                      minLength={2}
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </label>
                  <label className={b.paperField}>
                    {sl ? "Email za karte" : "Email for the tickets"}
                    <input
                      placeholder="ti@example.com"
                      name="email"
                      autoComplete="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </label>
                  <h2>{sl ? "Imena na kartah" : "Names on the tickets"}</h2>
                  <label className={s.checkRow}>
                    <input
                      type="checkbox"
                      checked={sameName}
                      onChange={e => setSameName(e.target.checked)}
                    />
                    {sl
                      ? "Za zdaj uporabi moje ime na vseh kartah"
                      : "Use my name on all tickets for now"}
                  </label>
                  {!sameName && (
                    <fieldset>
                      <legend>
                        {sl
                          ? "Ena karta za vsako osebo"
                          : "One ticket for each person"}
                      </legend>
                      {names.map((_, i) => (
                        <label key={i} className={b.attendeeField}>
                          {sl ? "Udeleženec" : "Attendee"} {i + 1}
                          <input
                            placeholder={
                              sl ? "Ime na karti" : "Name on the pass"
                            }
                            name={"holder-" + i}
                            required
                            minLength={2}
                            autoComplete="off"
                            value={holders[i] || ""}
                            onChange={e =>
                              setHolders(current => {
                                const next = [...current];
                                next[i] = e.target.value;
                                return next;
                              })
                            }
                          />
                        </label>
                      ))}
                    </fieldset>
                  )}
                  <p className={s.previewNote}>
                    {sl
                      ? "Imena ostanejo samo v tem predogledu in se ne shranijo."
                      : "Names stay in this preview and are not saved."}
                  </p>
                  <button type="submit" className={s.primaryButton}>
                    {sl ? "Preglej rezervacijo" : "Review your booking"} ↗
                  </button>
                </form>
              ) : (
                <div>
                  <h2>
                    {sl ? "Vse na svojem mestu." : "Everything in its place."}
                  </h2>
                  <div className={s.reviewBlock}>
                    <p>
                      <strong>{name}</strong>
                    </p>
                    <p>{email}</p>
                    <ol>
                      {names.map((n, i) => (
                        <li key={i}>
                          {n} · {sl ? "festivalska karta" : "festival pass"}
                        </li>
                      ))}
                    </ol>
                    {booking.tents > 0 && (
                      <p>
                        {sl ? "Šotori za dve osebi" : "Two-person tents"}:{" "}
                        {booking.tents}
                      </p>
                    )}
                    {booking.transport > 0 && (
                      <p>
                        {booking.origin === "maribor" ? "Maribor" : "Ljubljana"}{" "}
                        ↔ Libeliče · {booking.transport}{" "}
                        {sl ? "sedežev" : "seats"}
                        <br />
                        <small>
                          {sl
                            ? "Termin še ni potrjen."
                            : "Departure time to be confirmed."}
                        </small>
                      </p>
                    )}
                    {booking.credit > 0 && (
                      <p>
                        {price(booking.credit)} →{" "}
                        {formatCredit(totals.walletCredit, locale)} ·{" "}
                        {sl ? "kupčeva denarnca" : "buyer’s wallet"}
                        <br />
                        <small>
                          +{formatCredit(totals.walletBonus, locale)}{" "}
                          {sl ? "bonusa (10 %)" : "bonus (10%)"}
                        </small>
                      </p>
                    )}
                  </div>
                  <h2>{sl ? "Plačilo" : "Payment"}</h2>
                  <p className={s.previewNote}>
                    {sl
                      ? "V tem predogledu ni vnosa kartice ali plačila."
                      : "This preview does not collect card details or take payment."}
                  </p>
                  <div
                    className={s.paymentMethods}
                    aria-label={
                      sl
                        ? "Prikaz plačilnih metod"
                        : "Payment method presentation"
                    }
                  >
                    <span>{sl ? "Kartica" : "Card"}</span>
                    <span>Apple Pay</span>
                    <span>Google Pay</span>
                  </div>
                  <button className={s.primaryButton} onClick={() => move(3)}>
                    {sl ? "Zaključi predogled" : "Complete preview"} ↗
                  </button>
                  <br />
                  <button className={s.checkoutBack} onClick={() => move(1)}>
                    {sl ? "Uredi podatke" : "Edit details"}
                  </button>
                </div>
              )}
            </div>
            <aside className={s.orderSummary}>
              <span className={b.receiptLogo} aria-label="Endemit">
                <EndemitLogo />
              </span>
              <span className={b.receiptStamp}>
                {sl ? "GREMO V ŠUMO" : "INTO THE FOREST"}
              </span>
              <p className={s.kicker}>
                {sl ? "Tvoja rezervacija" : "Your booking"}
              </p>
              <h3>
                Endemit
                <br />
                13—15.08.2027
              </h3>
              <dl>
                <div>
                  <dt>
                    {totals.people} × {sl ? "karta" : "pass"}
                  </dt>
                  <dd>{price(totals.passes)}</dd>
                </div>
                {booking.tents > 0 && (
                  <div>
                    <dt>
                      {booking.tents} × {sl ? "šotor" : "tent"}
                    </dt>
                    <dd>{price(totals.tents)}</dd>
                  </div>
                )}
                {booking.transport > 0 && (
                  <div>
                    <dt>
                      {booking.transport} × {sl ? "prevoz" : "transport"}
                    </dt>
                    <dd>{price(totals.transport)}</dd>
                  </div>
                )}
                {booking.credit > 0 && (
                  <div>
                    <dt>
                      {sl ? "Polnjenje denarnce" : "Wallet top-up"}
                      <small className={b.walletReward}>
                        {sl ? "Dobiš" : "Receive"}{" "}
                        {formatCredit(totals.walletCredit, locale)} (+10%)
                      </small>
                    </dt>
                    <dd>{price(booking.credit)}</dd>
                  </div>
                )}
              </dl>
              <div className={s.total}>
                <span>{sl ? "Skupaj" : "Total"}</span>
                <strong>{price(totals.total)}</strong>
              </div>
              <a className={s.checkoutBack} href={base + "#tickets"}>
                {sl ? "Uredi izbiro" : "Edit selection"}
              </a>
              <small>
                {sl
                  ? "Vzorčne cene · brez plačila"
                  : "Illustrative prices · no payment"}
              </small>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
