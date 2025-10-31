import type { Metadata } from "next";
import Cart from "@/app/_components/checkout/Checkout";
import OuterPage from "@/app/_components/ui/OuterPage";
import PageHeadline from "@/app/_components/ui/PageHeadline";

export const metadata: Metadata = {
  title: "Secure checkout",
  description:
    "Secure checkout for Endemit store. Review your order, enter shipping details, and complete your purchase safely with SSL encryption.",
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
