"use client";

import { useState } from "react";
import OrderActions from "./OrderActions";
import RefundDialog from "./RefundDialog";
import { ProductInOrder } from "@/domain/order/types/order";
import { DeliveryMethod, OrderStatus } from "@prisma/client";

interface OrderActionsWrapperProps {
  orderId: string;
  status: OrderStatus;
  items: ProductInOrder[];
  deliveryMethod?: DeliveryMethod;
  totalAmount: number;
  refundedAmount: number;
  userPermissions: string[];
}

export default function OrderActionsWrapper({
  orderId,
  status,
  items,
  deliveryMethod,
  totalAmount,
  refundedAmount,
  userPermissions,
}: OrderActionsWrapperProps) {
  const [showRefundDialog, setShowRefundDialog] = useState(false);

  return (
    <>
      <OrderActions
        orderId={orderId}
        status={status}
        items={items}
        deliveryMethod={deliveryMethod}
        totalAmount={totalAmount}
        refundedAmount={refundedAmount}
        userPermissions={userPermissions}
        onOpenRefundDialog={() => setShowRefundDialog(true)}
      />

      <RefundDialog
        orderId={orderId}
        items={items}
        isOpen={showRefundDialog}
        onClose={() => setShowRefundDialog(false)}
      />
    </>
  );
}
