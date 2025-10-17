import type { Metadata } from "next";
import PageHeadline from "@/components/PageHeadline";
import OuterPage from "@/components/OuterPage";
import InnerPage from "@/components/InnerPage";
import ActionButton from "@/components/ActionButton";
import { stripe } from "@/services/stripe";
import { transformPriceFromStripe } from "@/services/stripe/util";
import { formatDecimalPrice } from "@/lib/formatting";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Checkout Canceled",
  description: "Your checkout session was canceled.",
  openGraph: {
    description: "Your checkout session was canceled.",
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
        title="Payment not complete!"
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          {
            label: "Payment not complete",
            path: `checkout/canceled?session_id=${session_id}`,
          },
        ]}
      />

      <InnerPage>
        <div className="flex items-center justify-center">
          <div className="max-w-md w-full text-center py-8">
            {/* Info Icon */}
            <div className="mb-8 flex justify-center">
              <svg
                className="w-24 h-24"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  fill="none"
                  style={{
                    strokeDasharray: 283,
                    strokeDashoffset: 283,
                    animation: "draw 0.5s ease-out forwards",
                  }}
                />
                <path
                  d="M50 30 L50 55"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  strokeLinecap="round"
                  style={{
                    strokeDasharray: 25,
                    strokeDashoffset: 25,
                    animation: "draw 0.4s ease-out 0.3s forwards",
                  }}
                />
                <circle
                  cx="50"
                  cy="68"
                  r="3"
                  fill="#fbbf24"
                  style={{
                    opacity: 0,
                    animation: "fadeIn 0.3s ease-out 0.6s forwards",
                  }}
                />
              </svg>
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
