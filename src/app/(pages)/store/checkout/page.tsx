import type { Metadata } from "next";
import Checkout from "@/app/_components/checkout/Checkout";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";
import { fetchProductsFromCms } from "@/domain/cms/operations/fetchProductsFromCms";
import { prismic } from "@/lib/services/prismic";
import { getCurrentUser } from "@/lib/services/auth";

export const metadata: Metadata = {
  title: "Secure checkout",
  description:
    "Secure checkout for Endemit store. Review your order, enter shipping details, and complete your purchase safely with SSL encryption.",
};

export default async function CheckoutPage() {
  const featuredProducts = await fetchProductsFromCms({
    filters: [prismic.filter.at("my.product.featured_product", true)],
  });

  const user = await getCurrentUser();

  return (
    <OuterPage>
      <PageHeadline
        title={"Checkout"}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          { label: "Checkout", path: "checkout" },
        ]}
      />
      <Checkout products={featuredProducts} userEmail={user?.email || undefined} />
    </OuterPage>
  );
}
