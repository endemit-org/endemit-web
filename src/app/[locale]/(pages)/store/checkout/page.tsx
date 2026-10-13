import type { Metadata } from "next";
import Checkout from "@/app/_components/checkout/Checkout";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { prismic } from "@/lib/services/prismic";
import { getCurrentUser } from "@/lib/services/auth";
import { getPickupEvents } from "@/domain/checkout/operations/getPickupEvents";
import { resolveCartPrefill } from "@/domain/checkout/operations/resolveCartPrefill";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "sl" | "en",
    namespace: "store",
  });
  return {
    title: t("checkout.metaTitle"),
    description: t("checkout.metaDescription"),
  };
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  setRequestLocale(locale as "sl" | "en");
  const loc = locale === "en" ? "en" : "sl";
  const t = await getTranslations("store");

  // Shareable pre-filled link: ?cart=product-uid:2,other-uid&code=FRIENDS20
  const firstParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const [
    featuredProducts,
    currencyProducts,
    donationProducts,
    user,
    pickupEvents,
  ] = await Promise.all([
    fetchProductsFromCms({
      filters: [prismic.filter.at("my.product.featured_product", true)],
      locale: loc,
    }),
    fetchProductsFromCms({
      filters: [prismic.filter.at("my.product.product_category", "Currencies")],
      locale: loc,
    }),
    fetchProductsFromCms({
      filters: [prismic.filter.at("my.product.uid", "donation-to-association")],
      locale: loc,
    }),
    getCurrentUser(),
    getPickupEvents(),
  ]);

  const prefill = await resolveCartPrefill({
    cartParam: firstParam(query.cart),
    codeParam: firstParam(query.code),
    locale: loc,
  });

  const donationProduct = donationProducts?.[0] ?? null;

  return (
    <OuterPage>
      <PageHeadline
        title={t("checkout.title")}
        segments={[
          { label: "Endemit", path: "" },
          { label: t("breadcrumb.store"), path: "store" },
          { label: t("checkout.breadcrumb"), path: "checkout" },
        ]}
      />
      <Checkout
        products={featuredProducts}
        currencyProducts={currencyProducts ?? []}
        donationProduct={donationProduct}
        userEmail={user?.email || undefined}
        pickupEvents={pickupEvents}
        prefill={prefill}
      />
    </OuterPage>
  );
}
