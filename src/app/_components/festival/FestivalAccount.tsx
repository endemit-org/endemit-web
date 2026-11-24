"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { AUTH_STATE_CHANGED_EVENT, useCurrentUser } from "@/app/_hooks/useCurrentUser";
import type { FestivalLocale } from "./copy";
import styles from "./festival.module.css";

const text = {
  en: { signIn: "Sign in", signOut: "Sign out", profile: "Wallet and tickets", haveAccount: "Have an account?", notYou: "Not you?" },
  sl: { signIn: "Prijava", signOut: "Odjava", profile: "Denarnca pa karte", haveAccount: "Maš že račun?", notYou: "Nisi ti?" },
} as const;

/**
 * Who is signed in, with the way in and out.
 * "bar" sits in the hero corner; "inline" is a text line inside the checkout.
 */
export default function FestivalAccount({ locale, variant = "bar" }: { locale: FestivalLocale; variant?: "bar" | "inline" }) {
  const t = text[locale];
  const { user, isLoading } = useCurrentUser();
  const pathname = usePathname();
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(pathname || "/festival")}`;

  const signOut = async () => {
    const response = await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => null);
    if (!response?.ok) return;
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
    // The page was rendered for the signed-in user (prefilled email): load it again.
    window.location.reload();
  };

  if (isLoading) return null;

  if (variant === "inline") {
    return user ? (
      <p className={styles.fieldNote}>
        {t.notYou}{" "}
        <button type="button" className={styles.linkButton} onClick={signOut}>
          {t.signOut}
        </button>
      </p>
    ) : (
      <p className={styles.fieldNote}>
        {t.haveAccount}{" "}
        <Link className={styles.linkButton} href={signInHref}>
          {t.signIn}
        </Link>
      </p>
    );
  }

  return (
    <div className={styles.account}>
      {user ? (
        <>
          <Link href="/profile" className={styles.accountWho} title={t.profile}>
            <i aria-hidden />
            {user.email ?? user.name ?? t.profile}
          </Link>
          <button type="button" onClick={signOut}>
            {t.signOut}
          </button>
        </>
      ) : (
        <Link href={signInHref}>{t.signIn}</Link>
      )}
    </div>
  );
}
