import { createTranslator, type NamespaceKeys, type NestedKeyOf } from "next-intl";
import type messages from "../../../messages/en.json";

type Messages = typeof messages;

/**
 * Builds a translator for use OUTSIDE of a Next.js request scope — e.g. inside
 * Inngest functions and React Email templates rendered with
 * `@react-email/render`. Request-scoped helpers (`getTranslations`) do not work
 * there, so we load the message bundle directly.
 *
 * @param locale  The recipient's locale ("sl" | "en"); anything else falls back
 *                to "sl".
 * @param namespace  A message namespace, e.g. "emails.newTicket".
 */
export async function getEmailTranslator<
  NS extends NamespaceKeys<Messages, NestedKeyOf<Messages>>,
>(locale: string, namespace: NS) {
  const resolved = locale === "en" ? "en" : "sl";
  const bundle: Messages = (await import(`../../../messages/${resolved}.json`))
    .default;

  return createTranslator({
    locale: resolved,
    messages: bundle,
    namespace,
  });
}
