"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import clsx from "clsx";

/**
 * Toggles between Slovenian ("Koroščina") and English. Persists the manual
 * choice in a cookie, which takes precedence over Vercel geo detection in the
 * middleware. Maps the current page to its counterpart in the other locale.
 */
export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  const other: AppLocale = locale === "sl" ? "en" : "sl";

  const switchTo = () => {
    document.cookie = `${LOCALE_COOKIE}=${other};path=/;max-age=31536000;samesite=lax`;
    router.replace(pathname, { locale: other });
  };

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={t(other)}
      className={clsx(
        "font-heading tracking-widest uppercase text-neutral-300 hover:text-white transition-colors",
        className
      )}
    >
      {t(other)}
    </button>
  );
}
