import * as React from "react";
import { MasterTemplate } from "@/domain/email/templates/MasterTemplate";
import { Order } from "@prisma/client";
import { Img, Text } from "@react-email/components";
import { formatDecimalPrice, formatPrice } from "@/lib/formatting";
import { ProductInOrder } from "@/domain/order/types/order";

interface Props {
  order: Order;
}

function NewOrderToCustomerTemplate({ order }: Props) {
  if (!order.items) {
    return null;
  }
  const orderItemsObject = order.items as unknown as {
    items: ProductInOrder[];
  };
  const orderItems = orderItemsObject.items;

  return (
    <MasterTemplate>
      ß
      <div>
        <h1>
          Your Order for {order.id}{" "}
          {formatDecimalPrice(Number(order.totalAmount))}
        </h1>
        <div>Thank you for shopping at endemit</div>

        <table className="mb-4 w-full">
          <thead>
            <tr>
              <th className="border-b border-gray-200 py-2">&nbsp;</th>
              <th
                align="left"
                className="border-b border-gray-200 py-2 text-gray-500"
                colSpan={6}
              >
                <Text className="font-semibold">Product</Text>
              </th>
              <th
                align="center"
                className="border-b border-gray-200 py-2 text-gray-500"
              >
                <Text className="font-semibold">Quantity</Text>
              </th>
              <th
                align="center"
                className="border-b border-gray-200 py-2 text-gray-500"
              >
                <Text className="font-semibold">Price</Text>
              </th>
              <th
                align="center"
                className="border-b border-gray-200 py-2 text-gray-500"
              >
                <Text className="font-semibold">Total</Text>
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems &&
              orderItems.length > 0 &&
              orderItems.map((item, index) => {
                return (
                  <tr key={`order-item-${index}`}>
                    <td className="border-b border-gray-200 py-2">
                      <Img
                        alt={item.name}
                        className="rounded-lg object-cover"
                        height={110}
                        src={item.image.src}
                      />
                    </td>
                    <td
                      align="left"
                      className="border-b border-gray-200 py-2"
                      colSpan={6}
                    >
                      <Text>{item.name}</Text>
                    </td>
                    <td
                      align="center"
                      className="border-b border-gray-200 py-2"
                    >
                      <Text>{item.quantity}</Text>
                    </td>
                    <td
                      align="center"
                      className="border-b border-gray-200 py-2"
                    >
                      <Text>{formatPrice(item.price)}</Text>
                    </td>
                    <td
                      align="center"
                      className="border-b border-gray-200 py-2"
                    >
                      <Text>{formatPrice(item.quantity * item.price)}</Text>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </MasterTemplate>
  );
}

export { NewOrderToCustomerTemplate };
