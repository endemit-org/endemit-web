"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import clsx from "clsx";

/**
 * Language switcher for the UNLOCALIZED tree (admin/POS/scan/staging-login),
 * whose URLs are never locale-prefixed. Unlike the public `LanguageSwitcher`
 * (which navigates to the prefixed counterpart via `@/i18n/navigation`), this
 * one just flips the `ENDEMIT_LOCALE` cookie and calls `router.refresh()` from
 * `next/navigation` — re-running the server components (and `getRequestConfig`)
 * on the same URL. Client state (e.g. the POS cart) is preserved across refresh.
 *
 * Shows the label of the *other* locale next to a globe icon (direct switch).
 */
export default function CookieLanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  const target: AppLocale = locale === "sl" ? "en" : "sl";

  const switchTo = () => {
    document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={t("label")}
      className={clsx(
        // Color is supplied by the caller so this reads correctly on both the
        // dark admin sidebar and the light POS/scan navbars.
        "flex items-center gap-x-2 font-heading tracking-widest uppercase transition-colors",
        className
      )}
    >
      {/* Globe icon for clarity that this switches language */}
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path
          d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{t(target)}</span>
    </button>
  );
}
