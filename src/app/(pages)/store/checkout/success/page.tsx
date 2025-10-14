import type { Metadata } from "next";
import { stripe } from "@/services/stripe";
import ClearCheckoutValues from "@/components/checkout/ClearCheckoutValues";
import { getOrderByStripeSession } from "@/domain/order/actions";
import { transformPriceFromStripe } from "@/services/stripe/util";

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

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  if (!session_id) {
    return <div>No session found</div>;
  }

  // Fetch session details server-side
  const session = await stripe.checkout.sessions.retrieve(session_id);
  const order = await getOrderByStripeSession(session_id);

  return (
    <div className=" mx-auto space-y-8 sm:max-w-full pt-24 px-4 lg:pt-16">
      <h1 className="text-3xl font-bold text-white mb-8">SUCCESS</h1>
      {session && session.amount_total && session.currency && (
        <>
          <p>Payment status: {session.payment_status}</p>
          <p>
            Amount: {transformPriceFromStripe(session.amount_total)} Order:{" "}
            {order && order.email}
            {session.currency.toUpperCase()}
            {/*{session.line_items.map(item => (*/}
            {/*  <div>{item.}</div>*/}
            {/*)}*/}
          </p>
        </>
      )}
      <ClearCheckoutValues />
    </div>
  );
}
