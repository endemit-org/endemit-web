import type { Metadata } from "next";
import Cart from "@/components/checkout/Checkout";
import OuterPage from "@/components/content/OuterPage";
import PageHeadline from "@/components/content/PageHeadline";

export const metadata: Metadata = {
  title: "Merch",
  description: "Exclusive Endemit merchandise, coming soon.",
  openGraph: {
    description: "Exclusive Endemit merchandise, coming soon.",
    images: ["/images/og/endemit-og.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function CheckoutPage() {
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
      <Cart />
    </OuterPage>
  );
}
