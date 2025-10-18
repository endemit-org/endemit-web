import type { Metadata } from "next";
import PageHeadline from "@/components/content/PageHeadline";
import OuterPage from "@/components/content/OuterPage";
import InnerPage from "@/components/content/InnerPage";
import ActionButton from "@/components/form/ActionButton";
import { stripe } from "@/services/stripe";
import { transformPriceFromStripe } from "@/services/stripe/util";
import { formatDecimalPrice } from "../../../../../../../lib/formatting";
import Link from "next/link";
import AnimatedWarningIcon from "@/components/icon/AnimatedWarningIcon";

export const metadata: Metadata = {
  title: "Payment interrupted ",
  description: "Your payment session was interrupted.",
  openGraph: {
    description: "Your payment session was interrupted.",
    images: ["/images/og/endemit-og.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function CanceledPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <div>No session found</div>;
  }

  const session = await stripe.checkout.sessions.retrieve(session_id);
  const totalAmount = formatDecimalPrice(
    transformPriceFromStripe(Number(session.amount_total))
  );

  return (
    <OuterPage>
      <PageHeadline
        title="Your payment was interrupted!"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          {
            label: "Payment interrupted",
            path: `checkout/interrupted?session_id=${session_id}`,
          },
        ]}
      />

      <InnerPage>
        <div className="flex items-center justify-center">
          <div className="max-w-md w-full text-center py-8">
            {/* Info Icon */}
            <div className="mb-8 flex justify-center">
              <AnimatedWarningIcon />
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Payment Not Completed
            </h1>

            <p className="text-gray-400 mb-8">
              You returned from the payment page without completing your order.
              Don&#39;t worry, your cart is still saved.
            </p>

            {/* Amount Box */}
            <div className="bg-zinc-900 rounded-lg p-4 mb-8">
              <p className="text-gray-500 text-sm mb-1">Order Total</p>
              <p className="text-white text-2xl">{totalAmount}</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <ActionButton href={session.url ?? ""} variant="primary">
                Complete Payment
              </ActionButton>

              <ActionButton href="/store/checkout" variant="secondary">
                Return to Cart
              </ActionButton>
            </div>

            <p className="text-gray-500 text-sm mt-6">
              Need help?{" "}
              <Link href="mailto:endemit@endemit.org" className="link">
                Contact us
              </Link>
            </p>
          </div>
        </div>
      </InnerPage>
    </OuterPage>
  );
}
