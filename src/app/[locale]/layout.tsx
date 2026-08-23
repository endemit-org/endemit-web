import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import RootShell from "@/app/_components/RootShell";
import { routing, type AppLocale } from "@/i18n/routing";
import { buildRootMetadata } from "@/lib/util/rootMetadata";

// Emitted as <meta name="color-scheme" content="dark"> — tells forced-dark
// browsers (Samsung Internet) not to re-darken our already-dark palette.
export const viewport: Viewport = {
  colorScheme: "dark",
};

export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const ogLocale = locale === "en" ? "en_US" : "sl_SI";
  return buildRootMetadata(ogLocale);
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this locale.
  setRequestLocale(locale as AppLocale);

  return (
    <RootShell lang={locale}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </RootShell>
  );
}
