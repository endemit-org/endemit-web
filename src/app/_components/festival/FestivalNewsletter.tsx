"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type FormEvent } from "react";
import { trackEvent } from "@/app/_components/analytics/trackEvent";
import { subscribeFromClient } from "@/domain/newsletter/actions/subscribeFromClient";
import { TrackedEvent } from "@/lib/services/tracking/events";
import { getApiPath } from "@/lib/util/api";
import type { FestivalLocale } from "./copy";
import styles from "./festival.module.css";

const text = {
  en: {
    label: "Email",
    placeholder: "your@email",
    submit: "Sign me up",
    sending: "Sending",
    done: "You are in",
    doneNote: "We write when there is news.",
    invalid: "Enter a valid email.",
    failed: "That did not work. Try again.",
  },
  sl: {
    label: "Email",
    placeholder: "tvoj@email",
    submit: "Zapiši me",
    sending: "Pošilam",
    done: "Zapisan si",
    doneNote: "Pišemo, ko bo kej novga.",
    invalid: "Vpiši veljavn email.",
    failed: "Ni šlo. Probi še enkrat.",
  },
} as const;

type State = "idle" | "loading" | "success";

export default function FestivalNewsletter({ locale, description }: { locale: FestivalLocale; description: string }) {
  const t = text[locale];
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError(t.invalid);
      return;
    }
    setError("");
    setState("loading");
    const result = await subscribeFromClient({ email: value, apiEndpoint: getApiPath("newsletter/festival-subscribe") });
    if (result.success) {
      trackEvent(TrackedEvent.LEAD, { contentName: "Festival 2027" });
      setState("success");
    } else {
      setState("idle");
      setError(result.error || t.failed);
    }
  };

  if (state === "success") {
    return (
      <p className={styles.signedUp} role="status">
        <img src="/images/festival/2027/creature-2.webp" width={200} height={266} alt="" />
        {t.done}
        <small>
          {email.trim()} · {t.doneNote}
        </small>
      </p>
    );
  }

  return (
    <>
      <p className={styles.lede}>{description}</p>
      <form className={styles.signup} onSubmit={submit} noValidate>
        <input
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          aria-label={t.label}
          placeholder={t.placeholder}
          value={email}
          onChange={e => {
            setEmail(e.target.value);
            setError("");
          }}
          aria-invalid={Boolean(error)}
        />
        <button type="submit" className={`${styles.tag} ${styles.tagSolid}`} disabled={state === "loading"}>
          {state === "loading" ? t.sending : `${t.submit} →`}
        </button>
      </form>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
