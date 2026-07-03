"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_COOKIE, type AppLocale } from "@/i18n/routing";
import FlagKoroska from "@/app/_components/icon/FlagKoroska";
import FlagEnglish from "@/app/_components/icon/FlagEnglish";
import clsx from "clsx";

const FLAGS: Record<AppLocale, ComponentType<{ className?: string }>> = {
  sl: FlagKoroska,
  en: FlagEnglish,
};

const LOCALES: AppLocale[] = ["sl", "en"];

/**
 * Language switcher with custom flags. Renders a compact button showing the
 * active locale's flag + label; opens a popover with both options. The manual
 * choice is persisted in a cookie, which takes precedence over Vercel geo
 * detection in the middleware, and maps the current page to its counterpart in
 * the target locale.
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

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const switchTo = (target: AppLocale) => {
    setOpen(false);
    if (target === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${target};path=/;max-age=31536000;samesite=lax`;
    router.replace(pathname, { locale: target });
  };

  const CurrentFlag = FLAGS[locale];

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className="flex items-center gap-x-2 font-heading tracking-widest uppercase text-neutral-300 hover:text-white transition-colors"
      >
        <CurrentFlag className="h-4 w-6 rounded-[3px] shadow-sm ring-1 ring-black/20" />
        <span>{t(locale)}</span>
        <svg
          viewBox="0 0 12 8"
          className={clsx(
            "h-2 w-2.5 transition-transform",
            open && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M1 1.5 L6 6.5 L11 1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("label")}
          className="absolute bottom-full right-0 z-50 mb-2 min-w-[10rem] overflow-hidden rounded-md border border-neutral-800 bg-neutral-900/95 py-1 shadow-xl backdrop-blur-sm"
        >
          {LOCALES.map(loc => {
            const Flag = FLAGS[loc];
            const isCurrent = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={isCurrent}>
                <button
                  type="button"
                  onClick={() => switchTo(loc)}
                  className={clsx(
                    "flex w-full items-center gap-x-3 px-3 py-2 text-left font-heading tracking-widest uppercase transition-colors",
                    isCurrent
                      ? "text-white bg-white/5 cursor-default"
                      : "text-neutral-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Flag className="h-4 w-6 flex-shrink-0 rounded-[3px] shadow-sm ring-1 ring-black/20" />
                  <span className="flex-1">{t(loc)}</span>
                  {isCurrent && (
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        d="M3 8.5 L6.5 12 L13 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
