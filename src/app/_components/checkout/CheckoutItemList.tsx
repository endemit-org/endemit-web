import { CountryCode } from "@/domain/checkout/types/country";
import CheckoutItem from "@/app/_components/checkout/CheckoutItem";
import { CartItem } from "@/domain/checkout/types/cartItem";

interface Props {
  items: CartItem[];
  onRemoveItem?: (id: string) => void;
  editable?: boolean;
  country?: CountryCode;
}

export default function CheckoutItemList({
  items,
  onRemoveItem,
  country,
  editable = false,
}: Props) {
  return (
    <div className="space-y-3">
      {items.map(item => (
        <CheckoutItem
          key={item.id}
          item={item}
          country={country}
          onRemoveItem={onRemoveItem}
          editable={editable}
        />
      ))}
    </div>
  );
}
