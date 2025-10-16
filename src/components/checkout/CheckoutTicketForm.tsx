import Input from "@/components/form/Input";
import { CartItem } from "@/types/cart";
import { CheckoutFormData } from "@/types/checkout";
import { CheckoutValidationService } from "@/app/services/validation/validation.service";

interface CheckoutFormProps {
  index: number;
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
  item: CartItem;
}

export default function CheckoutTicketForm({
  index,
  item,
  formData,
  errorMessages,
  onFormChange,
}: CheckoutFormProps) {
  const name = `ticket-${item.id}-${index + 1}-name`;
  const errorFieldName =
    CheckoutValidationService.formatComplementaryTicketKey(name);
  const errorMessage = errorMessages[errorFieldName] as string;

  return (
    <div className="text-sm text-red-600">
      <Input
        name={name}
        label={`Ticket holder ${index + 1} name`}
        type="text"
        value={
          formData.complementaryTicketData
            ? (formData.complementaryTicketData[name] as string)
            : ""
        }
        onChange={onFormChange}
        errorMessage={errorMessage}
        required={true}
      />
    </div>
  );
}
