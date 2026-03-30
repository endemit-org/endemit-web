"use client";

interface PosItem {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  direction: "CREDIT" | "DEBIT";
}

interface Props {
  items: PosItem[];
  onAddItem: (item: PosItem) => void;
  disabledDirection?: "CREDIT" | "DEBIT" | null;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("sl-SI", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function PosItemGrid({ items, onAddItem, disabledDirection }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No items available at this register
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map(item => {
        const isDisabled = disabledDirection === item.direction;
        return (
          <button
            key={item.id}
            onClick={() => !isDisabled && onAddItem(item)}
            disabled={isDisabled}
            className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
              isDisabled
                ? "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                : "bg-white border-gray-200 hover:border-blue-500 hover:shadow-md active:scale-95"
            }`}
          >
            <span className="text-sm font-medium text-gray-900 text-center line-clamp-2">
              {item.name}
            </span>
            <span
              className={`mt-2 text-lg font-bold ${
                item.direction === "CREDIT" ? "text-green-600" : "text-gray-900"
              }`}
            >
              {item.direction === "CREDIT" ? "+" : ""}
              {formatPrice(item.cost)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
