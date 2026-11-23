import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import FestivalCheckout from "@/app/_components/festival/FestivalCheckout";
import type { FestivalLocale } from "@/app/_components/festival/copy";
import { loadFestival } from "@/app/_components/festival/data";
import { fetchProductFromCmsByUid } from "@/domain/cms/operations/fetchProductFromCms";
import { isProductSellable } from "@/domain/product/businessLogic";
import { getCurrentUser } from "@/lib/services/auth";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "Endemit festival · Checkout",
  robots: { index: false, follow: false },
};

export default async function FestivalCheckoutPage({ params }: PageProps) {
  const locale: FestivalLocale = (await params).locale === "en" ? "en" : "sl";
  setRequestLocale(locale);
  const [data, user, donationProduct] = await Promise.all([
    loadFestival(locale),
    getCurrentUser().catch(() => null),
    // The same donation product the shop checkout offers.
    fetchProductFromCmsByUid("donation-to-association", locale).catch(() => null),
  ]);
  const donation = donationProduct && isProductSellable(donationProduct).isSellable ? donationProduct : null;
  return <FestivalCheckout locale={locale} offers={data.offers} salesOpen={data.salesOpen} demo={data.demo} userEmail={user?.email ?? ""} donationProduct={donation} />;
}
