import type { Metadata } from "next";
import ClearCheckoutValues from "@/app/_components/checkout/ClearCheckoutValues";

import OuterPage from "@/app/_components/content/OuterPage";
import PageHeadline from "@/app/_components/content/PageHeadline";
import CheckoutSuccessConfetti from "@/app/_components/checkout/CheckoutSuccessConfetti";
import InnerPage from "@/app/_components/content/InnerPage";
import ActionButton from "@/app/_components/form/ActionButton";
import AnimatedSuccessIcon from "@/app/_components/icon/AnimatedSuccessIcon";
import { getOrderByStripeSession } from "@/domain/order/operations/getOrderByStripeSession";
import { transformTicketsFromOrder } from "@/domain/order/transformers/transformTicketsFromOrder";
import { stripe } from "@/lib/services/stripe";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "✅ Order Confirmed",
  description:
    "Your order on endemit.org was successfully confirmed. Please continue or close this page.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SuccessPage({
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

  if (session.status !== "complete") {
    notFound();
  }

  const order = await getOrderByStripeSession(sessionId);

  if (!order) {
    notFound();
  }

  const tickets = transformTicketsFromOrder(order);
  const orderHasTickets = tickets && tickets.length > 0;
  const ticketHolders =
    orderHasTickets &&
    tickets
      .map(ticket => {
        return ticket.metadata?.ticketholders;
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
            path: `checkout/success/${sessionId}`,
          },
        ]}
      />

      <InnerPage>
        <div className={"flex items-center justify-center"}>
          <div className="max-w-md w-full text-center py-8">
            {/* Animated Checkmark */}
            <div className="mb-8 flex justify-center">
              <AnimatedSuccessIcon />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-neutral-200 mb-4">
              Order Confirmed!
            </h1>

            <p className="text-gray-400 mb-6">
              Thank you for your order. A confirmation email has been sent to
            </p>

            {order.email && (
              <div className="bg-zinc-900 rounded-lg p-4 mb-8">
                <p className="text-gray-500 text-sm mb-1">Email</p>
                <p className="text-neutral-200 text-sm break-all">
                  {order.email}
                </p>
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
                <p className="text-neutral-200 text-sm break-all">{order.id}</p>
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
      <CheckoutSuccessConfetti targetElementId={"successIcon"} />
    </OuterPage>
  );
}
