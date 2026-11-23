"use client";
import { useEffect, useState } from "react";
import {
  bookingKey,
  bookingTotals,
  initialBooking,
  money,
  walletCreditFor,
  formatCredit,
  normalizeBooking,
  type Booking,
} from "./booking";
import baseStyles from "./editorial.module.css";
import b from "./booking.module.css";
import EndemitLogo from "@/app/_components/icon/EndemitLogo";
import { Quantity, PackingIcon } from "./BookingControls";
const s = Object.fromEntries(
  Object.entries(baseStyles).map(([name, value]) => [
    name,
    [value, b[name]].filter(Boolean).join(" "),
  ])
);

export default function TicketBuilder({ locale }: { locale: "en" | "sl" }) {
  const sl = locale === "sl";
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const value = sessionStorage.getItem(bookingKey);
      if (value) setBooking(normalizeBooking(JSON.parse(value)));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        sessionStorage.setItem(bookingKey, JSON.stringify(booking));
      } catch {}
  }, [booking, loaded]);
  const totals = bookingTotals(booking);
  const price = (n: number) => money(n, locale);
  const update = (patch: Partial<Booking>) =>
    setBooking(b => normalizeBooking({ ...b, ...patch }));
  return (
    <section
      id="tickets"
      className={`${s.section} ${s.ticketSection} ${b.booking} light-scheme`}
    >
      <p className={s.kicker}>
        06 / {sl ? "Tvoj vikend v šumi" : "Your weekend in the forest"}
      </p>
      <div className={s.sectionHeading}>
        <h2>
          {sl ? "Pridi po svoje." : "Make it yours."}
          <br />
          <em>{sl ? "Ostan med svojimi." : "Stay with your people."}</em>
        </h2>
        <p>
          {sl
            ? "Izberi svojo karto. Dodaj sam tisto, ko rabiš. Za ostalo poskrbi šuma."
            : "Choose your pass. Add just what you need. Let the forest take care of the rest."}
        </p>
      </div>
      <p className={s.previewNote}>
        {sl
          ? "Predogled rezervacije · vzorčne cene, ne ponudba za 2027. Plačilo se ne izvede."
          : "Booking preview · illustrative prices, not 2027 offers. No payment is taken."}
      </p>
      <div className={s.bookingLayout}>
        <div>
          <fieldset className={s.passChoices}>
            <legend>{sl ? "01 — S kom prideš?" : "01 — Who’s coming?"}</legend>
            {(["single", "duo", "group"] as const).map((pass, i) => (
              <label
                key={pass}
                className={booking.pass === pass ? s.selected : ""}
              >
                <input
                  type="radio"
                  name="festival-pass"
                  value={pass}
                  checked={booking.pass === pass}
                  onChange={() => update({ pass })}
                />
                <span className={b.ticketEdition}>
                  ENDEMIT ’27 <span>0{i + 1}</span>
                </span>
                <span className={s.passStars} aria-hidden="true">
                  {["✦", "✦ ✦", "✦ ✦ ✦"][i]}
                </span>
                <strong>
                  {
                    [
                      sl ? "Solo" : "Single",
                      sl ? "V dvoje" : "Duo",
                      sl ? "S plemenom" : "Group",
                    ][i]
                  }
                </strong>
                <small>
                  {
                    [
                      sl ? "Za enega" : "One person",
                      sl ? "Za dva" : "Two people",
                      sl ? "Za 4–10 kolegov" : "For 4–10 friends",
                    ][i]
                  }
                </small>
                <b>
                  {price([89, 168, 79][i])}
                  {pass === "group" && (
                    <small> / {sl ? "osebo" : "person"}</small>
                  )}
                </b>
                <span className={b.ticketStub}>
                  <span>13—15 AUG / LIBELIČE</span>
                  <span>
                    {booking.pass === pass
                      ? sl
                        ? "GREMO ✓"
                        : "LET’S GO ✓"
                      : "↗"}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          {booking.pass === "group" && (
            <div className={b.crewCount}>
              <Quantity
                label={sl ? "Kolko vas pride?" : "How many of you?"}
                value={booking.groupSize}
                min={4}
                max={10}
                onChange={groupSize => update({ groupSize })}
                locale={locale}
              />
              <p>
                {sl
                  ? "Ena karta za vsakega. Ena skupna pot."
                  : "A pass each. A journey together."}
              </p>
            </div>
          )}
          <div className={s.addons}>
            <h3>
              {sl ? "02 — Še kaj za zraven?" : "02 — A little extra comfort?"}
            </h3>
            <div className={`${s.addon} ${booking.tents > 0 ? b.packed : ""}`}>
              <span className={s.addonIcon}>
                <PackingIcon kind="tent" />
              </span>
              <div>
                <h4>{sl ? "Šotor te že čaka" : "A tent waiting for you"}</h4>
                <p>
                  {sl
                    ? "Dve osebi · cev festival · vzorčna ponudba"
                    : "Two people · whole festival · sample offer"}
                </p>
                <b>
                  {price(45)} / {sl ? "šotor" : "tent"}
                </b>
              </div>
              <Quantity
                label={sl ? "Število šotorov" : "Number of tents"}
                value={booking.tents}
                max={Math.ceil(totals.people / 2)}
                onChange={tents => update({ tents })}
                locale={locale}
              />
            </div>
            <div
              className={`${s.addon} ${booking.transport > 0 ? b.packed : ""}`}
            >
              <span className={s.addonIcon}>
                <PackingIcon kind="ride" />
              </span>
              <div>
                <h4>{sl ? "Prevoz do šume" : "A ride to the forest"}</h4>
                <p>
                  {sl
                    ? "Povratni prevoz · vzorčna ponudba"
                    : "Return transport · sample offer"}
                </p>
                <b>
                  {price(25)} / {sl ? "osebo" : "person"}
                </b>
                <fieldset className={b.departures}>
                  <legend>{sl ? "Odhod" : "From"} → Libeliče</legend>
                  {(["ljubljana", "maribor"] as const).map(origin => (
                    <label key={origin}>
                      <input
                        type="radio"
                        name="transport-origin"
                        value={origin}
                        checked={booking.origin === origin}
                        onChange={() => update({ origin })}
                      />
                      <span>
                        {origin === "ljubljana" ? "Ljubljana" : "Maribor"}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>
              <Quantity
                label={sl ? "Število sedežev" : "Transport seats"}
                value={booking.transport}
                max={totals.people}
                onChange={transport => update({ transport })}
                locale={locale}
              />
            </div>
            <fieldset className={s.credit}>
              <legend>
                {sl
                  ? "Denarnca za prve runde"
                  : "A wallet ready for the first round"}
              </legend>
              <p>
                {sl
                  ? "Pri polnjenju dobiš 10 % zraven. Dobroimetje gre v kupčevo denarnco."
                  : "Get 10% extra with every top-up. Credit goes to the buyer’s wallet."}
              </p>
              <div>
                {[0, 25, 50, 100].map(n => (
                  <label
                    key={n}
                    className={booking.credit === n ? s.selected : ""}
                  >
                    <input
                      type="radio"
                      name="wallet-credit"
                      value={n}
                      aria-label={
                        n === 0
                          ? sl
                            ? "Brez polnjenja"
                            : "No top-up"
                          : `${sl ? "Plačaš" : "Pay"} ${price(n)}, ${sl ? "dobiš" : "receive"} ${formatCredit(walletCreditFor(n), locale)}`
                      }
                      checked={booking.credit === n}
                      onChange={() => update({ credit: n })}
                    />
                    <span className={b.coinValue}>
                      {n === 0 ? "—" : price(n)}
                    </span>
                    <span>
                      {n === 0
                        ? sl
                          ? "Kasneje"
                          : "Later"
                        : `→ ${formatCredit(walletCreditFor(n), locale)}`}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
        <aside className={s.orderSummary}>
          <span className={b.receiptLogo} aria-label="Endemit">
            <EndemitLogo />
          </span>
          <span className={b.receiptStamp}>
            {sl ? "GREMO V ŠUMO" : "INTO THE FOREST"}
          </span>
          <p className={s.kicker}>
            {sl ? "Tvoj mali pobeg" : "Your little escape"}
          </p>
          <h3>
            Endemit
            <br />
            13—15.08.2027
          </h3>
          <dl>
            <div>
              <dt>
                {totals.people} × {sl ? "festivalska karta" : "festival pass"}
              </dt>
              <dd>{price(totals.passes)}</dd>
            </div>
            {booking.tents > 0 && (
              <div>
                <dt>
                  {booking.tents} × {sl ? "šotor za dva" : "two-person tent"}
                </dt>
                <dd>{price(totals.tents)}</dd>
              </div>
            )}
            {booking.transport > 0 && (
              <div>
                <dt>
                  {booking.transport} × {sl ? "prevoz" : "transport"} ·{" "}
                  {booking.origin === "maribor" ? "Maribor" : "Ljubljana"}
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
            <strong aria-live="polite">
              <span key={totals.total} className={b.totalChange}>
                {price(totals.total)}
              </span>
            </strong>
          </div>
          <a
            className={s.primaryButton}
            href={`${sl ? "" : "/en"}/festival/checkout`}
            onClick={() => {
              try {
                sessionStorage.setItem(bookingKey, JSON.stringify(booking));
              } catch {}
            }}
          >
            {sl ? "Naprej na rezervacijo" : "Continue to booking"}{" "}
            <span>↗</span>
          </a>
          <small>
            {sl
              ? "Predogled · naslednji korak: podatki udeležencev"
              : "Preview · next: attendee details"}
          </small>
        </aside>
      </div>
    </section>
  );
}
