import type { Metadata } from "next";
import PageHeadline from "@/app/_components/content/PageHeadline";
import OuterPage from "@/app/_components/content/OuterPage";
import InnerPage from "@/app/_components/content/InnerPage";
import ActionButton from "@/app/_components/form/ActionButton";
import { stripe } from "@/lib/services/stripe";
import { formatDecimalPrice } from "@/lib/util/formatting";
import Link from "next/link";
import AnimatedWarningIcon from "@/app/_components/icon/AnimatedWarningIcon";
import { transformPriceFromStripe } from "@/domain/checkout/transformers/transformPriceFromStripe";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "⚠️ Payment interrupted",
  description: "Your payment was interrupted and has not completed your order.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function InterruptedPage({
  params,
}: {
  params: Promise<{
    sessionId: string;
  }>;
}) {
  const { sessionId } = await params;

  if (!sessionId) {
    notFound();
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const totalAmount = formatDecimalPrice(
    transformPriceFromStripe(Number(session.amount_total))
  );

  if (session.status !== "open") {
    notFound();
  }

  return (
    <OuterPage>
      <PageHeadline
        title="Your payment was interrupted!"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          {
            label: "Payment interrupted",
            path: `checkout/interrupted/${sessionId}`,
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
            <h1 className="text-3xl font-bold text-neutral-200 mb-4">
              Payment Not Completed
            </h1>

            <p className="text-gray-400 mb-8">
              You returned from the payment page without completing your order.
              Don&#39;t worry, your cart is still saved.
            </p>

            {/* Amount Box */}
            <div className="bg-zinc-900 rounded-lg p-4 mb-8">
              <p className="text-gray-500 text-sm mb-1">Order Total</p>
              <p className="text-neutral-200 text-2xl">{totalAmount}</p>
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
