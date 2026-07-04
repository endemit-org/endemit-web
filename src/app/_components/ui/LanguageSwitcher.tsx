"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import clsx from "clsx";

/**
 * Language switcher rendered as a single direct-switch link: it shows the label
 * of the *other* locale next to a globe icon and, on click, switches straight to
 * it (no dropdown, no "current language" state). The manual choice is persisted
 * in a cookie, which takes precedence over Vercel geo detection in the
 * middleware, and maps the current page to its counterpart in the target locale.
 */
export default function LanguageSwitcher({
  className,
}: {
  className?: string;
}) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("languageSwitcher");

  const target: AppLocale = locale === "sl" ? "en" : "sl";

  const switchTo = () => {
    document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=31536000;samesite=lax`;
    router.replace(pathname, { locale: target });
  };

  return (
    <button
      type="button"
      onClick={switchTo}
      aria-label={t("label")}
      className={clsx(
        "flex items-center gap-x-2 font-heading tracking-widest uppercase text-neutral-300 hover:text-white transition-colors",
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
