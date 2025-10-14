import { formatDateTime, formatPrice } from "@/lib/formatting";
import CartQtyControl from "@/components/cart/CartQtyControl";
import { CartItem } from "@/types/cart";
import {
  isProductSellable,
  isProductSellableByCutoffDate,
  isProductTicket,
} from "@/domain/product/businessLogic";
import CheckoutTicketForm from "@/components/checkout/CheckoutTicketForm";
import { CheckoutFormData } from "@/types/checkout";
import Image from "next/image";
import { Country } from "@/types/country";
import { ensureDateType } from "@/lib/util";

interface Props {
  items: CartItem[];
  onRemoveItem: (id: string) => void;
  formData: CheckoutFormData;
  errorMessages: Record<
    string,
    | string
    | {
        [p: string]: string;
      }
    | undefined
  >;
  onFormChange: (name: string, value: string) => void;
  country?: Country;
}

export default function CheckoutItemList({
  items,
  onRemoveItem,
  formData,
  errorMessages,
  onFormChange,
  country,
}: Props) {
  return (
    <div className="space-y-3">
      {items.map(item => {
        const isTicket = isProductTicket(item);
        const isSellableObject = isProductSellable(item, country);

        return (
          <div
            key={item.id}
            className="p-3 bg-gray-50 rounded-md overflow-hidden"
          >
            <div className="flex items-center justify-between">
              {item.images[0].src && (
                <Image
                  src={item.images[0].src}
                  alt={item.name}
                  width={64}
                  height={64}
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.name}</h4>
                <p className="text-sm text-gray-600">
                  {item.checkoutDescription} · {formatPrice(item.price)} each
                </p>
              </div>

              <CartQtyControl item={item} />

              <div className="flex items-center space-x-3">
                <div className="text-right min-w-[4rem]">
                  <p className="font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="ml-2 text-red-500 hover:text-red-700 transition-colors"
                  aria-label="Remove item"
                >
                  🗑️
                </button>
              </div>
            </div>
            {!isSellableObject?.isSellableByRegion && (
              <div className={"text-red-600"}>
                Warning, this product can not be shipped to {country}
              </div>
            )}
            {item?.limits?.quantityLimit &&
              item.quantity > item.limits.quantityLimit && (
                <div className={"text-red-600"}>
                  Warning, the maximum quantity for this product is{" "}
                  {item.limits.quantityLimit}
                </div>
              )}

            {item.limits?.cutoffTimestamp &&
              !isProductSellableByCutoffDate(item) && (
                <div>No longer sellable</div>
              )}
            {item.limits?.cutoffTimestamp &&
              isProductSellableByCutoffDate(item) && (
                <div>
                  This item is available for sale until{" "}
                  {formatDateTime(ensureDateType(item.limits.cutoffTimestamp))}
                </div>
              )}
            {isTicket && (
              <div>
                As a backup for lost tickets or inability to scan at the event,
                please provide the name of each ticket holder:
                {new Array(item.quantity).fill(0).map((_, index) => (
                  <CheckoutTicketForm
                    key={`${item.id}-${index}`}
                    index={index}
                    item={item}
                    formData={formData}
                    errorMessages={errorMessages}
                    onFormChange={onFormChange}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
