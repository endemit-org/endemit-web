import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["sl", "en"],
  defaultLocale: "sl",
  // Slovenian is served without a prefix; English lives under /en.
  localePrefix: "as-needed",
  // We run our own detection (cookie + Vercel geo) in the middleware, so
  // next-intl must not attempt Accept-Language / cookie detection itself.
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];

export const LOCALE_COOKIE = "ENDEMIT_LOCALE";
