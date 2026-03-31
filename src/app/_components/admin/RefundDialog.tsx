"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProductInOrder } from "@/domain/order/types/order";
import { formatPrice } from "@/lib/util/formatting";
import clsx from "clsx";

interface RefundLimitResult {
  maxRefundAmount: number;
  itemBreakdown: {
    itemIndex: number;
    itemName: string;
    itemCategory: string;
    unitPrice: number;
    originalQuantity: number;
    alreadyRefunded: number;
    requestedQuantity: number;
    maxRefundableQuantity: number;
    maxRefundableAmount: number;
    limitReason: string | null;
  }[];
  shippingRefundable: number;
  shippingAlreadyRefunded: boolean;
  limitedBy: "none" | "wallet_balance" | "already_refunded" | "quantity_exceeded";
  walletBalance: number | null;
  totalOrderAmount: number;
  totalAlreadyRefunded: number;
  orderHasShipping: boolean;
  shippingAmountCents: number;
}

interface RefundDialogProps {
  orderId: string;
  items: ProductInOrder[];
  isOpen: boolean;
  onClose: () => void;
  onRefundComplete?: () => void;
}

export default function RefundDialog({
  orderId,
  items,
  isOpen,
  onClose,
  onRefundComplete,
}: RefundDialogProps) {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Map<number, number>>(new Map());
  const [includeShipping, setIncludeShipping] = useState(false);
  const [reason, setReason] = useState("");
  const [refundLimit, setRefundLimit] = useState<RefundLimitResult | null>(null);
  const [shippingInfo, setShippingInfo] = useState<{ hasShipping: boolean; amount: number; alreadyRefunded: boolean } | null>(null);
  const [isLoadingLimit, setIsLoadingLimit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch refund limit when selection changes
  const fetchRefundLimit = useCallback(async () => {
    if (selectedItems.size === 0 && !includeShipping) {
      setRefundLimit(null);
      return;
    }

    setIsLoadingLimit(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/refund-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Array.from(selectedItems.entries()).map(([idx, qty]) => ({
            itemIndex: idx,
            quantity: qty,
          })),
          includeShipping,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to calculate refund limit");
      }

      const data = await response.json();
      setRefundLimit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate refund");
    } finally {
      setIsLoadingLimit(false);
    }
  }, [orderId, selectedItems, includeShipping]);

  useEffect(() => {
    const debounce = setTimeout(fetchRefundLimit, 300);
    return () => clearTimeout(debounce);
  }, [fetchRefundLimit]);

  // Fetch shipping info when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchShippingInfo = async () => {
      try {
        const response = await fetch(`/api/v1/admin/orders/${orderId}/refund-limit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [] }),
        });

        if (response.ok) {
          const data = await response.json();
          setShippingInfo({
            hasShipping: data.orderHasShipping,
            amount: data.shippingAmountCents,
            alreadyRefunded: data.shippingAlreadyRefunded,
          });
        }
      } catch {
        // Ignore - shipping info is optional
      }
    };

    fetchShippingInfo();
  }, [isOpen, orderId]);

  const toggleItem = (index: number) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.set(index, items[index].quantity);
    }
    setSelectedItems(newSelected);
  };

  const updateQuantity = (index: number, quantity: number) => {
    const newSelected = new Map(selectedItems);
    if (quantity <= 0) {
      newSelected.delete(index);
    } else {
      newSelected.set(index, Math.min(quantity, items[index].quantity));
    }
    setSelectedItems(newSelected);
  };

  const handleProcessRefund = async () => {
    const hasSelection = selectedItems.size > 0 || includeShipping;
    if (!hasSelection || !refundLimit || refundLimit.maxRefundAmount <= 0) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/admin/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Array.from(selectedItems.entries()).map(([idx, qty]) => ({
            itemIndex: idx,
            quantity: qty,
          })),
          includeShipping,
          reason: reason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Refund failed");
      }

      onRefundComplete?.();
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedItems(new Map());
    setIncludeShipping(false);
    setReason("");
    setRefundLimit(null);
    setShippingInfo(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Process Refund</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select items to refund. Refunds are processed via Stripe.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Item selection */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Select Items</h3>
            {items.map((item, index) => {
              const isSelected = selectedItems.has(index);
              const selectedQty = selectedItems.get(index) ?? 0;
              const breakdown = refundLimit?.itemBreakdown.find(
                b => b.itemIndex === index
              );

              return (
                <div
                  key={index}
                  className={clsx(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => toggleItem(index)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItem(index)}
                        className="mt-1 w-4 h-4"
                        onClick={e => e.stopPropagation()}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.category} • {formatPrice(item.price)} each
                        </p>
                        {breakdown && breakdown.alreadyRefunded > 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            {breakdown.alreadyRefunded} of {item.quantity} already refunded
                          </p>
                        )}
                        {breakdown?.limitReason && isSelected && (
                          <p className="text-xs text-amber-600 mt-1">
                            {breakdown.limitReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {isSelected && item.quantity > 1 && (
                        <div
                          className="flex items-center gap-2 mb-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                            onClick={() => updateQuantity(index, selectedQty - 1)}
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm">{selectedQty}</span>
                          <button
                            className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                            onClick={() => updateQuantity(index, selectedQty + 1)}
                          >
                            +
                          </button>
                        </div>
                      )}
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * (isSelected ? selectedQty : item.quantity))}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Shipping refund option */}
            {(() => {
              const hasShipping = refundLimit?.orderHasShipping ?? shippingInfo?.hasShipping;
              const shippingAmount = refundLimit?.shippingAmountCents ?? shippingInfo?.amount ?? 0;
              const alreadyRefunded = refundLimit?.shippingAlreadyRefunded ?? shippingInfo?.alreadyRefunded ?? false;

              if (!hasShipping) return null;

              return (
                <div
                  className={clsx(
                    "p-3 rounded-lg border transition-colors cursor-pointer",
                    includeShipping
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300",
                    alreadyRefunded && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !alreadyRefunded && setIncludeShipping(!includeShipping)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={includeShipping}
                        onChange={() => setIncludeShipping(!includeShipping)}
                        disabled={alreadyRefunded}
                        className="mt-1 w-4 h-4"
                        onClick={e => e.stopPropagation()}
                      />
                      <div>
                        <p className="font-medium text-gray-900">Shipping</p>
                        <p className="text-sm text-gray-500">
                          Delivery fee
                        </p>
                        {alreadyRefunded && (
                          <p className="text-xs text-amber-600 mt-1">
                            Already refunded
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatPrice(shippingAmount / 100)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Refund summary */}
          {refundLimit && (selectedItems.size > 0 || includeShipping) && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              {refundLimit.shippingRefundable > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping refund:</span>
                  <span className="font-medium">
                    {formatPrice(refundLimit.shippingRefundable / 100)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total refund amount:</span>
                <span className="font-medium">
                  {isLoadingLimit ? "..." : formatPrice(refundLimit.maxRefundAmount / 100)}
                </span>
              </div>
              {refundLimit.limitedBy === "wallet_balance" && (
                <p className="text-xs text-amber-600">
                  Limited by remaining wallet balance ({formatPrice((refundLimit.walletBalance ?? 0) / 100)})
                </p>
              )}
              {refundLimit.totalAlreadyRefunded > 0 && (
                <p className="text-xs text-gray-500">
                  Previously refunded: {formatPrice(refundLimit.totalAlreadyRefunded / 100)}
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Reason for refund..."
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleProcessRefund}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-red-600 hover:bg-red-700 text-white",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            disabled={
              isProcessing ||
              (selectedItems.size === 0 && !includeShipping) ||
              !refundLimit ||
              refundLimit.maxRefundAmount <= 0
            }
          >
            {isProcessing ? "Processing..." : "Process Refund"}
          </button>
        </div>
      </div>
    </div>
  );
}
