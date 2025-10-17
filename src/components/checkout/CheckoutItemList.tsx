import { CartItem } from "@/types/cart";
import { Country } from "@/types/country";
import CheckoutItem from "@/components/checkout/CheckoutItem";

interface Props {
  items: CartItem[];
  onRemoveItem?: (id: string) => void;
  editable?: boolean;
  country?: Country;
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
