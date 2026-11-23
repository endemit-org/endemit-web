import type { Metadata } from "next";
import FestivalCheckoutPreview from "@/app/_components/festival/FestivalCheckoutPreview";
export const metadata: Metadata = {
  title: "Festival 27 · Booking preview",
  robots: { index: false, follow: false },
};
export default async function CheckoutPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <FestivalCheckoutPreview locale={locale === "en" ? "en" : "sl"} />;
}
