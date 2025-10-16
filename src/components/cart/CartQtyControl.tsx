import { useCart } from "@/stores/CartStore";
import { CartItem } from "@/types/cart";
import IncrementalInput from "@/components/form/IncrementalInput";

interface Props {
  item: CartItem;
}

export default function CartQtyControl({ item }: Props) {
  const { decrementItem, incrementItem } = useCart();
  const maxQty = item.limits?.quantityLimit ?? 99;

  const handleDecrement = () => {
    decrementItem(item.id);
  };

  const handleIncrement = () => {
    if (item.quantity < maxQty) {
      incrementItem(item.id);
    }
  };

  return (
    <IncrementalInput
      handleDecrement={handleDecrement}
      handleIncrement={handleIncrement}
      quantity={item ? item.quantity : 0}
    />
  );
}
