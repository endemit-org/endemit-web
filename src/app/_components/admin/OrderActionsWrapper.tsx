"use client";

import { useState } from "react";
import OrderActions from "./OrderActions";
import RefundDialog from "./RefundDialog";
import { ProductInOrder } from "@/domain/order/types/order";
import { OrderStatus } from "@prisma/client";

interface OrderActionsWrapperProps {
  orderId: string;
  status: OrderStatus;
  items: ProductInOrder[];
  totalAmount: number;
  refundedAmount: number;
  userPermissions: string[];
}

export default function OrderActionsWrapper({
  orderId,
  status,
  items,
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
