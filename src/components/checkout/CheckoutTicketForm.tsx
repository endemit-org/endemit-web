import Input from "@/components/form/Input";
import { CartItem } from "@/types/cart";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { CheckoutValidationService } from "@/services/validation/validation.service";

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
  validationTriggered?: boolean;
  onEnter: (type: "manual" | "auto") => void;
  item: CartItem;
}

export default function CheckoutTicketForm({
  index,
  item,
  formData,
  errorMessages,
  onFormChange,
  onEnter,
  validationTriggered,
}: CheckoutFormProps) {
  const name = `ticket-${item.id}-${index + 1}-name`;
  const errorFieldName =
    CheckoutValidationService.formatComplementaryTicketKey(name);
  const errorMessage = errorMessages[errorFieldName] as string;

  const handleValidateForm = () => {
    onEnter("manual");
  };

  return (
    <div className="text-sm text-red-600">
      <Input
        name={name}
        prefix={"Name"}
        label={`Ticket holder ${index + 1} name for ${item.name}`}
        type="text"
        value={
          formData.complementaryTicketData
            ? (formData.complementaryTicketData[name] as string)
            : ""
        }
        onChange={onFormChange}
        validationTriggered={validationTriggered}
        onEnter={handleValidateForm}
        errorMessage={errorMessage}
        required={true}
      />
    </div>
  );
}
