import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Text, Link } from "@react-email/components";
import { PUBLIC_BASE_WEB_URL } from "@/lib/services/env/public";

interface Props {
  orderId: string;
}

function OrderShippedToCustomerTemplate({ orderId }: Props) {
  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">
          Your order has been shipped!
        </h1>
        <Text className="text-gray-800 mb-2">Order #{orderId}</Text>
        <Text className="text-gray-600 mb-6">
          Great news! Your order is now on its way to you. You can expect
          delivery within the next couple of work days.
        </Text>

        <div
          style={{
            marginBottom: "32px",
            marginTop: "24px",
            textAlign: "center",
          }}
        >
          <Link
            href={`${PUBLIC_BASE_WEB_URL}/profile/orders/${orderId}`}
            style={{
              display: "inline-block",
              backgroundColor: "#18181b",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            View Your Order
          </Link>
        </div>

        <Text className="text-gray-600 text-sm">
          Questions about your delivery? Contact us at{" "}
          <Link href="mailto:endemit@endemit.org" className="link">
            endemit@endemit.org
          </Link>
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { OrderShippedToCustomerTemplate };
