"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  getOrderActions,
  filterActionsByPermissions,
  buildOrderContext,
  OrderAction,
  OrderActionConfig,
} from "@/domain/order/operations/getOrderActions";
import { OrderStatus } from "@prisma/client";
import { ProductInOrder } from "@/domain/order/types/order";

interface OrderActionsProps {
  orderId: string;
  status: OrderStatus;
  items: ProductInOrder[];
  totalAmount: number;
  refundedAmount: number;
  userPermissions: string[];
  onActionComplete?: () => void;
  onOpenRefundDialog?: () => void;
}

export default function OrderActions({
  orderId,
  status,
  items,
  totalAmount,
  refundedAmount,
  userPermissions,
  onActionComplete,
  onOpenRefundDialog,
}: OrderActionsProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<OrderAction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendEmailFlags, setSendEmailFlags] = useState<Record<string, boolean>>({});

  // Build context and get available actions
  const context = buildOrderContext({
    status,
    items,
    totalAmount: totalAmount * 100, // Convert to cents
    refundedAmount,
  });

  const allActions = getOrderActions(context);
  const actions = filterActionsByPermissions(allActions, userPermissions);

  const handleAction = async (action: OrderAction, sendEmail?: boolean) => {
    // Special handling for refund actions that need a dialog
    if (action === "process_refund" || action === "request_refund") {
      onOpenRefundDialog?.();
      setPendingAction(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sendEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Action failed");
      }

      onActionComplete?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setIsLoading(false);
      setPendingAction(null);
    }
  };

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions.map((config) => (
          <ActionButton
            key={config.action}
            config={config}
            isLoading={isLoading && pendingAction === config.action}
            disabled={isLoading}
            onConfirm={() => handleAction(config.action, sendEmailFlags[config.action])}
            onRequestConfirmation={() => setPendingAction(config.action)}
            showConfirmation={pendingAction === config.action && config.requiresConfirmation}
            onCancelConfirmation={() => setPendingAction(null)}
            sendEmail={sendEmailFlags[config.action] ?? false}
            onSendEmailChange={(checked) =>
              setSendEmailFlags((prev) => ({ ...prev, [config.action]: checked }))
            }
          />
        ))}
      </div>
    </div>
  );
}

interface ActionButtonProps {
  config: OrderActionConfig;
  isLoading: boolean;
  disabled: boolean;
  onConfirm: () => void;
  onRequestConfirmation: () => void;
  showConfirmation: boolean;
  onCancelConfirmation: () => void;
  sendEmail: boolean;
  onSendEmailChange: (checked: boolean) => void;
}

function ActionButton({
  config,
  isLoading,
  disabled,
  onConfirm,
  onRequestConfirmation,
  showConfirmation,
  onCancelConfirmation,
  sendEmail,
  onSendEmailChange,
}: ActionButtonProps) {
  const buttonClasses = clsx(
    "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    {
      "bg-gray-100 hover:bg-gray-200 text-gray-800":
        config.variant === "default",
      "bg-red-600 hover:bg-red-700 text-white":
        config.variant === "destructive",
      "bg-amber-500 hover:bg-amber-600 text-white":
        config.variant === "warning",
    }
  );

  if (showConfirmation) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
        <span className="text-sm text-gray-600">{config.description}</span>
        <button
          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? "..." : "Confirm"}
        </button>
        <button
          className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm rounded"
          onClick={onCancelConfirmation}
          disabled={isLoading}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className={buttonClasses}
        onClick={config.requiresConfirmation ? onRequestConfirmation : onConfirm}
        disabled={disabled}
        title={config.description}
      >
        {isLoading ? "Processing..." : config.label}
      </button>
      {config.showEmailCheckbox && (
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => onSendEmailChange(e.target.checked)}
            disabled={disabled}
            className="rounded border-gray-300"
          />
          {config.emailCheckboxLabel}
        </label>
      )}
    </div>
  );
}
