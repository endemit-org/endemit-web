import type { Metadata } from "next";
import Checkout from "@/app/_components/checkout/Checkout";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { prismic } from "@/lib/services/prismic";
import { getCurrentUser } from "@/lib/services/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Secure checkout",
  description:
    "Secure checkout for Endemit store. Review your order, enter shipping details, and complete your purchase safely with SSL encryption.",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "sl" | "en");
  const loc = locale === "en" ? "en" : "sl";
  const t = await getTranslations("store");

  const [featuredProducts, currencyProducts, donationProducts, user] =
    await Promise.all([
      fetchProductsFromCms({
        filters: [prismic.filter.at("my.product.featured_product", true)],
        locale: loc,
      }),
      fetchProductsFromCms({
        filters: [
          prismic.filter.at("my.product.product_category", "Currencies"),
        ],
        locale: loc,
      }),
      fetchProductsFromCms({
        filters: [prismic.filter.at("my.product.uid", "donation-to-association")],
        locale: loc,
      }),
      getCurrentUser(),
    ]);

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
      />
    </OuterPage>
  );
}
