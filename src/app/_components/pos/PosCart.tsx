"use client";

import { useTranslations } from "next-intl";
import { formatTokensFromCents } from "@/lib/util/currency";

interface PosItem {
  id: string;
  name: string;
  cost: number;
}

interface CartItem {
  item: PosItem;
  quantity: number;
}

interface Props {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onClear: () => void;
  onCreateOrder: () => void;
  isCreating: boolean;
  /** Fulfillment-tracked registers: serving note ("no onions, blue jacket") */
  note?: string;
  onNoteChange?: (note: string) => void;
  showNote?: boolean;
}

export function PosCart({
  items,
  total,
  onUpdateQuantity,
  onClear,
  onCreateOrder,
  isCreating,
  note = "",
  onNoteChange,
  showNote = false,
}: Props) {
  const t = useTranslations("pos");

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">{t("cart.empty")}</div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-h-40 overflow-auto space-y-2 mb-4">
        {items.map(({ item, quantity }) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
          >
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate block">
                {item.name}
              </span>
              <span className="text-xs text-gray-500">
                {t("cart.each", { amount: formatTokensFromCents(item.cost) })}
              </span>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => onUpdateQuantity(item.id, quantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, quantity + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                +
              </button>
              <span className="w-20 text-right font-medium">
                {formatTokensFromCents(item.cost * quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showNote && onNoteChange && (
        <input
          type="text"
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          placeholder={t("cart.notePlaceholder")}
          disabled={isCreating}
          className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
      )}

      <div className="flex items-center justify-between border-t pt-4 gap-3">
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors"
        >
          {t("cart.clear")}
        </button>
        <div className="flex items-center gap-4">
          <span
            className={`text-lg font-bold ${total < 0 ? "text-red-600" : ""}`}
          >
            {formatTokensFromCents(total)}
          </span>
          <button
            onClick={onCreateOrder}
            disabled={isCreating || total < 0}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? t("cart.creating") : t("cart.createOrder")}
          </button>
        </div>
      </div>
      {total < 0 && (
        <p className="mt-2 text-right text-sm text-red-600">
          {t("cart.negativeTotal")}
        </p>
      )}
    </div>
  );
}
