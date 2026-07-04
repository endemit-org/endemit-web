import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { cookies } from "next/headers";
import { routing, LOCALE_COOKIE } from "./routing";

/**
 * Resolves the active locale for BOTH root layout trees.
 *
 * Inside `[locale]`, `setRequestLocale(locale)` (in that layout) guarantees
 * `requestLocale` is defined during static render — so the cookie/user branches
 * below are NEVER reached there and those pages stay statically generated.
 *
 * Outside `[locale]` (admin/POS/scan/staging-login/slice-simulator — all already
 * dynamic), `requestLocale` is undefined, so we resolve from the manual cookie,
 * then the signed-in user's stored preference, then the default. `getCurrentUser`
 * is React-`cache()`'d and already called by those protected layouts, so the DB
 * fallback adds no extra query.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  let locale = hasLocale(routing.locales, requested) ? requested : undefined;

  if (!locale) {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (hasLocale(routing.locales, cookieLocale)) {
      locale = cookieLocale;
    }
  }

  if (!locale) {
    // Lazy import keeps prisma/server-only code off the static [locale] path.
    const { getCurrentUser } = await import("@/lib/services/auth");
    const user = await getCurrentUser().catch(() => null);
    if (hasLocale(routing.locales, user?.locale)) {
      locale = user.locale;
    }
  }

  locale ??= routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
