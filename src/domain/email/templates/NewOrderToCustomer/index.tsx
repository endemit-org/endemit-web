import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Order } from "@prisma/client";
import { Img, Text, Link } from "@react-email/components";
import { formatDecimalPrice } from "../../../../../lib/formatting";
import { ProductInOrder } from "@/domain/order/types/order";
import { ShippingAddress } from "@/domain/checkout/types/checkout";
import { includesTicketProducts } from "@/domain/checkout/businessRules";
import { CartItem } from "@/types/cart";
import { getCountry } from "@/domain/checkout/actions";
import { getProductLink } from "@/domain/product/actions";

interface Props {
  order: Order;
}

function NewOrderToCustomerTemplate({ order }: Props) {
  if (!order.items) {
    return null;
  }

  const hasTicketItems = includesTicketProducts(
    order.items as unknown as CartItem[]
  );
  const orderItems = order.items as unknown as ProductInOrder[];
  const shippingAddress = order.shippingRequired
    ? (order.shippingAddress as ShippingAddress)
    : null;
  const countryDetails = shippingAddress
    ? getCountry(shippingAddress.country)
    : null;

  return (
    <MasterTemplate>
      <div>
        <h1 className="text-2xl font-bold mb-2">Thank you for your order!</h1>
        <Text className="text-gray-800 mb-6">Order #{order.id}</Text>
        <Text className="text-gray-600 mb-6">
          This is a confirmation of your order placed with us. Below are the
          details of your purchase.
          {shippingAddress && (
            <div>
              We will ship your order to the address provided shortly, usually
              within 3 - 5 days.
            </div>
          )}
        </Text>
        {hasTicketItems && (
          <Text className="text-gray-600 mb-6">
            Your tickets will be sent to your email within the next 10 minutes.
            Please check your inbox <i>(and spam folder)</i> for the ticket
            email. <strong>Each ticket will be sent separately</strong> with a
            QR code that you can present at the event for entry.
          </Text>
        )}

        {shippingAddress && (
          <div
            style={{
              marginTop: "32px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <Text className="font-semibold mb-2">Shipping Address</Text>
            <Text className="text-neutral-700 my-1">
              {shippingAddress.name}
            </Text>
            <Text className="text-neutral-700 my-1">
              {shippingAddress.address}
            </Text>
            <Text className="text-neutral-700 my-1">
              {shippingAddress.postalCode} {shippingAddress.city},{" "}
              {countryDetails?.flag} {countryDetails?.name}
            </Text>
            {shippingAddress.phone && (
              <Text className="text-neutral-700 my-1">
                Phone: {shippingAddress.phone}
              </Text>
            )}
          </div>
        )}

        <h2 className="text-xl font-bold mb-2 mt-10">Your order items</h2>

        <table style={{ width: "100%", marginBottom: "16px" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #e5e7eb", padding: "8px" }}>
                &nbsp;
              </th>
              <th
                align="left"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                  color: "#6b7280",
                }}
                colSpan={6}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  Product
                </Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">Qty</Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  Price
                </Text>
              </th>
              <th
                align="center"
                style={{
                  borderBottom: "1px solid #e5e7eb",
                  padding: "8px",
                }}
              >
                <Text className="font-semibold mb-1 text-neutral-800">
                  Total
                </Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems &&
              orderItems.length > 0 &&
              orderItems.map((item, index) => {
                return (
                  <tr key={`order-item-${index}`}>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          overflow: "hidden",
                          borderRadius: "8px",
                        }}
                      >
                        <Img
                          alt={item.name}
                          src={item.image.src}
                          width={80}
                          height={80}
                          style={{
                            width: "80px",
                            height: "80px",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      </div>
                    </td>
                    <td
                      align="left"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                      colSpan={6}
                    >
                      <Text className="mb-0">
                        <Link
                          href={getProductLink(item.uid, item.category, true)}
                          className={"text-neutral-900"}
                        >
                          {item.name}
                        </Link>
                      </Text>
                      <Text className={"mt-0 text-neutral-400"}>
                        {item.checkoutDescription}
                      </Text>
                    </td>
                    <td
                      align="center"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                    >
                      <Text>{item.quantity}</Text>
                    </td>
                    <td
                      align="center"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                    >
                      <Text>{formatDecimalPrice(item.price)}</Text>
                    </td>
                    <td
                      align="center"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                      }}
                    >
                      <Text>
                        {formatDecimalPrice(item.quantity * item.price)}
                      </Text>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>

        <table style={{ width: "100%", marginBottom: "24px" }}>
          <tbody>
            <tr>
              <td style={{ width: "50%" }}>&nbsp;</td>
              <td style={{ width: "50%" }}>
                <table style={{ width: "100%" }}>
                  <tbody>
                    <tr>
                      <td align="right" style={{ padding: "4px 0" }}>
                        <Text className="text-gray-600">Subtotal:</Text>
                      </td>
                      <td
                        align="right"
                        style={{ padding: "4px 0", paddingLeft: "16px" }}
                      >
                        <Text className="font-semibold">
                          {formatDecimalPrice(Number(order.subtotal))}
                        </Text>
                      </td>
                    </tr>
                    {order.shippingAmount &&
                      Number(order.shippingAmount) > 0 && (
                        <tr>
                          <td align="right" style={{ padding: "4px 0" }}>
                            <Text className="text-gray-600">
                              Shipping to {countryDetails?.flag}{" "}
                              {countryDetails?.name}:
                            </Text>
                          </td>
                          <td
                            align="right"
                            style={{ padding: "4px 0", paddingLeft: "16px" }}
                          >
                            <Text className="font-semibold">
                              {formatDecimalPrice(Number(order.shippingAmount))}
                            </Text>
                          </td>
                        </tr>
                      )}
                    {order.discountAmount &&
                      Number(order.discountAmount) < 0 && (
                        <tr>
                          <td align="right" style={{ padding: "4px 0" }}>
                            <Text className="text-gray-600">Discount:</Text>
                          </td>
                          <td
                            align="right"
                            style={{ padding: "4px 0", paddingLeft: "16px" }}
                          >
                            <Text className="font-semibold text-green-600">
                              {formatDecimalPrice(Number(order.discountAmount))}
                            </Text>
                          </td>
                        </tr>
                      )}
                    <tr>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold">Total:</Text>
                      </td>
                      <td
                        align="right"
                        style={{
                          padding: "12px 0 4px 0",
                          paddingLeft: "16px",
                          borderTop: "2px solid #000",
                        }}
                      >
                        <Text className="font-bold text-lg">
                          {formatDecimalPrice(Number(order.totalAmount))}
                        </Text>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
        <Text className="text-gray-600 my-6">
          Please feel free to reach out to our support team at
          <Link href={"mailto:endemit@endemit.org"} className={"link"}>
            endemit@endemit.org
          </Link>{" "}
          if you have any questions or need further assistance.
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { NewOrderToCustomerTemplate };
