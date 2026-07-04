import { useTranslations } from "next-intl";

interface Props {
  quantity: number;
  handleDecrement: () => void;
  handleIncrement: () => void;
}

export default function IncrementalInput({
  handleDecrement,
  handleIncrement,
  quantity,
}: Props) {
  const t = useTranslations("checkout.customer");
  return (
    <div className="flex items-center justify-center space-x-2 w-full">
      <button
        onClick={handleDecrement}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-400 transition-colors text-neutral-800"
        aria-label={t("decreaseQuantity")}
      >
        −
      </button>

      <span className="w-8 text-center font-medium ">{quantity}</span>

      <button
        onClick={handleIncrement}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-200 hover:bg-neutral-400 transition-colors text-neutral-800"
        aria-label={t("increaseQuantity")}
      >
        +
      </button>
    </div>
  );
}
