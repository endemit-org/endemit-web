"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import clsx from "clsx";

// Flags live in /public and are 100×60 (5:3).
const FLAGS: Record<AppLocale, string> = {
  sl: "/images/flag_koroska.png",
  en: "/images/flag_english.png",
};

/**
 * Language switcher rendered as a single direct-switch link: it shows the flag +
 * label of the *other* locale and, on click, switches straight to it (no
 * dropdown, no "current language" state). The manual choice is persisted in a
 * cookie, which takes precedence over Vercel geo detection in the middleware,
 * and maps the current page to its counterpart in the target locale.
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
