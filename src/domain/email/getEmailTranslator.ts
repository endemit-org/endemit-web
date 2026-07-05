import { createTranslator, type NamespaceKeys, type NestedKeyOf } from "next-intl";
import en from "../../../messages/en.json";
import sl from "../../../messages/sl.json";

type Messages = typeof en;

const bundles: Record<"sl" | "en", Messages> = { sl, en };

/**
 * Builds a translator for use OUTSIDE of a Next.js request scope — inside
 * Inngest functions and React Email templates rendered with
 * `@react-email/render`. Request-scoped helpers (`getTranslations`) do not work
 * there, so we load the statically-imported message bundle directly.
 *
 * Synchronous so it can be called inline inside a React Email component.
 *
 * @param locale     Recipient locale ("sl" | "en"); anything else falls back to "sl".
 * @param namespace  A message namespace, e.g. "emails.newTicket".
 */
export function getEmailTranslator<
  NS extends NamespaceKeys<Messages, NestedKeyOf<Messages>>,
>(locale: string, namespace: NS) {
  const resolved: "sl" | "en" = locale === "en" ? "en" : "sl";
  return createTranslator({
    locale: resolved,
    messages: bundles[resolved],
    namespace,
  });
}
