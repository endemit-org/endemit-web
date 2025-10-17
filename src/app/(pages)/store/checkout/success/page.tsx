import type { Metadata } from "next";
import ClearCheckoutValues from "@/components/checkout/ClearCheckoutValues";
import {
  getOrderByStripeSession,
  getTicketsFromOrder,
} from "@/domain/order/actions";
import OuterPage from "@/components/OuterPage";
import PageHeadline from "@/components/PageHeadline";
import CheckoutSuccessConfetti from "@/components/checkout/CheckoutSuccessConfetti";
import InnerPage from "@/components/InnerPage";
import ActionButton from "@/components/ActionButton";

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

  const order = await getOrderByStripeSession(session_id);

  if (!order) {
    return <div>No order found</div>;
  }

  const tickets = getTicketsFromOrder(order);
  const orderHasTickets = tickets && tickets.length > 0;
  const ticketHolders =
    orderHasTickets &&
    tickets
      .map(ticket => {
        const holderStringObject =
          ticket.price_data?.product_data?.metadata?.ticketHolders;
        return holderStringObject ? JSON.parse(holderStringObject) : "Unknown";
      })
      .flat();

  return (
    <OuterPage>
      <PageHeadline
        title={`Order ${order.id}`}
        segments={[
          { label: "Endemit", path: "" },
          { label: "Store", path: "store" },
          {
            label: `Order ${order.id}`,
            path: `checkout/success?session_id=${session_id}`,
          },
        ]}
      />

      <InnerPage>
        <div className={"flex items-center justify-center"}>
          <div className="max-w-md w-full text-center py-8">
            {/* Animated Checkmark */}
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
                  stroke="#4ade80"
                  strokeWidth="4"
                  fill="none"
                  className="animate-[draw_0.5s_ease-out_forwards]"
                  style={{
                    strokeDasharray: 283,
                    strokeDashoffset: 283,
                    animation: "draw 0.5s ease-out forwards",
                  }}
                />
                <path
                  d="M30 50 L45 65 L70 35"
                  stroke="#4ade80"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  className="animate-[draw_0.5s_ease-out_0.3s_forwards]"
                  style={{
                    strokeDasharray: 60,
                    strokeDashoffset: 60,
                    animation: "draw 0.5s ease-out 0.3s forwards",
                  }}
                />
              </svg>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Order Confirmed!
            </h1>

            <p className="text-gray-400 mb-6">
              Thank you for your order. A confirmation email has been sent to
            </p>

            {order.email && (
              <div className="bg-zinc-900 rounded-lg p-4 mb-8">
                <p className="text-gray-500 text-sm mb-1">Email</p>
                <p className="text-white text-sm break-all">{order.email}</p>
              </div>
            )}

            {orderHasTickets && ticketHolders && (
              <p className="text-gray-400 mb-6">
                Your tickets for <strong>{ticketHolders.join(", ")}</strong>{" "}
                will also be sent to your email shortly, within the next 30
                minutes.
              </p>
            )}

            {order.id && (
              <div className="bg-zinc-900 rounded-lg p-4 mb-8">
                <p className="text-gray-500 text-sm mb-1">Order ID</p>
                <p className="text-white text-sm break-all">{order.id}</p>
              </div>
            )}

            {/* Action Button */}
            <div className="inline-block">
              <ActionButton href={"/store"}>Continue Shopping</ActionButton>
            </div>
          </div>
        </div>
      </InnerPage>
      <ClearCheckoutValues />
      <CheckoutSuccessConfetti />
    </OuterPage>
  );
}
