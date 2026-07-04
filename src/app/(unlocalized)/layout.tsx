import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import RootShell from "@/app/_components/RootShell";
import { buildRootMetadata } from "@/lib/util/rootMetadata";

// Admin, POS, scan, staging and the slice simulator live outside the localized
// ([locale]) URL tree — their URLs are never prefixed. The active language is
// resolved from the ENDEMIT_LOCALE cookie / signed-in user preference (see
// src/i18n/request.ts). `getLocale()` makes every route under this layout
// dynamic, which is fine: they are all auth-protected / dev-only already.
export const metadata: Metadata = buildRootMetadata("en_US");

export default async function UnlocalizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <RootShell lang={locale}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </RootShell>
  );
}
