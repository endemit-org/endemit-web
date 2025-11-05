import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Order } from "@prisma/client";
import { Img, Text, Link } from "@react-email/components";
import { formatDecimalPrice } from "@/lib/util/formatting";
import { ProductInOrder } from "@/domain/order/types/order";
import { ShippingAddress } from "@/domain/checkout/types/checkout";
import { getProductLink } from "@/domain/product/actions/getProductLink";
import { getCountry } from "@/domain/checkout/actions/getCountry";
import { getResizedPrismicImage } from "@/lib/util/util";
import { includesShippableProduct } from "@/domain/order/businessLogic";

interface Props {
  order: Order;
}

function NewOrderToDispatcherTemplate({ order }: Props) {
  if (!order.items || !includesShippableProduct(order)) {
    return null;
  }

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
        <h1 className="text-2xl font-bold mb-2">
          A new order requires shipping
        </h1>
        <Text className="text-gray-800 mb-6">Order #{order.id}</Text>
        <Text className="text-gray-600 mb-6">
          This is a copy of an order placed with us on Endemit.org. Below are
          the details of the customers purchase that requires shipping.
          <div>
            We have stated that we will ship your order to the address provided
            shortly, usually within 3 - 5 days.
          </div>
        </Text>

        {shippingAddress && (
          <div
            style={{
              marginTop: "32px",
              padding: "16px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <Text className="font-semibold mb-2">Ship the order to:</Text>
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

        <h2 className="text-xl font-bold mb-2 mt-10">Order items</h2>

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
                const opacity = item.type === "Digital" ? 0.3 : 1;
                return (
                  <tr key={`order-item-${index}`}>
                    <td
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                        opacity,
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
                          src={getResizedPrismicImage(item.image.src, {
                            width: 160,
                          })}
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
                        opacity,
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
                        opacity,
                      }}
                    >
                      <Text>{item.quantity}</Text>
                    </td>
                    <td
                      align="center"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                        opacity,
                      }}
                    >
                      <Text>{formatDecimalPrice(item.price)}</Text>
                    </td>
                    <td
                      align="center"
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        padding: "8px",
                        opacity,
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
          Please feel free to reach out to the customer if you need to align any
          details of the order via{" "}
          <Link href={`mailto:${order.email}`} className={"link"}>
            {order.email}
          </Link>
          .
        </Text>
      </div>
    </MasterTemplate>
  );
}

export { NewOrderToDispatcherTemplate };
