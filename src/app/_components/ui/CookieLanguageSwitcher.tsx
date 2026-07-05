"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import clsx from "clsx";

// Flags live in /public and are 100×60 (5:3).
const FLAGS: Record<AppLocale, string> = {
  sl: "/images/flag_koroska.png",
  en: "/images/flag_english.png",
};

/**
 * Language switcher for the UNLOCALIZED tree (admin/POS/scan/staging-login),
 * whose URLs are never locale-prefixed. Unlike the public `LanguageSwitcher`
 * (which navigates to the prefixed counterpart via `@/i18n/navigation`), this
 * one just flips the `ENDEMIT_LOCALE` cookie and calls `router.refresh()` from
 * `next/navigation` — re-running the server components (and `getRequestConfig`)
 * on the same URL. Client state (e.g. the POS cart) is preserved across refresh.
 *
 * Shows the flag + label of the *other* locale (direct switch).
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
      {/* Flag of the target locale — the one you'd switch to */}
      <Image
        src={FLAGS[target]}
        alt=""
        width={100}
        height={60}
        className="h-4 w-6 flex-shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/20"
      />
      <span>{t(target)}</span>
    </button>
  );
}
