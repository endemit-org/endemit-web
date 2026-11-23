import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Festival from "@/app/_components/festival/Festival";
import { festivalCopy, type FestivalLocale } from "@/app/_components/festival/copy";
import { loadFestival } from "@/app/_components/festival/data";
import { fetchFooterFromCms } from "@/domain/cms/operations/fetchFooterFromCms";
import packageJson from "@/package.json";

type PageProps = { params: Promise<{ locale: string }> };

// Ticket batches change state over time; refresh the page every five minutes.
export const revalidate = 300;

const toLocale = (locale: string): FestivalLocale => (locale === "en" ? "en" : "sl");

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const t = festivalCopy[toLocale((await params).locale)];
  return {
    title: `Endemit festival · ${t.dateline} ${t.year} · ${t.place}`,
    description: t.about[0],
    openGraph: { images: ["/images/festival/2027/photo-smoke-dance-2.webp"] },
    // Hidden until launch.
    robots: { index: false, follow: false },
  };
}

export default async function FestivalPage({ params }: PageProps) {
  const locale = toLocale((await params).locale);
  setRequestLocale(locale);
  const [data, footer] = await Promise.all([loadFestival(locale), fetchFooterFromCms(locale).catch(() => null)]);
  // The same legal line and links as the site footer, edited in Prismic.
  const legal = footer
    ? {
        text: footer.text.replace("{YEAR}", new Date().getFullYear().toString()).replace("{VERSION}", `v${packageJson.version}`),
        links: footer.links.map(link => ({ href: link.link, label: link.label })),
      }
    : null;
  // The landing page needs prices only; full products are loaded at checkout.
  const offers = data.offers.map(offer => ({ ...offer, product: null }));
  return <Festival locale={locale} data={{ ...data, offers }} legal={legal} />;
}
