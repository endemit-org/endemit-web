import Input from "@/app/_components/form/Input";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import { CheckoutValidationService } from "@/lib/services/validation/validation.service";
import { CartItem } from "@/domain/checkout/types/cartItem";

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
  onFormChangeAction: (name: string, value: string) => void;
  validationTriggered?: boolean;
  onEnter: (type: "manual" | "auto") => boolean;
  item: CartItem;
}

export default function CheckoutTicketForm({
  index,
  item,
  formData,
  errorMessages,
  onFormChangeAction,
  onEnter,
  validationTriggered,
}: CheckoutFormProps) {
  const name = `ticket-${item.id}-${index + 1}-name`;
  const errorFieldName =
    CheckoutValidationService.formatComplementaryTicketKey(name);
  const errorMessage = errorMessages[errorFieldName] as string;

  const handleOnEnter = () => {
    onEnter("manual");
  };

  return (
    <div className="text-sm text-red-600">
      <Input
        name={name}
        prefix={"Name"}
        label={`Ticket holder ${index + 1} name @ ${item.name}`}
        type="text"
        value={
          formData.complementaryTicketData
            ? (formData.complementaryTicketData[name] as string)
            : ""
        }
        onChangeAction={onFormChangeAction}
        validationTriggered={validationTriggered}
        onEnter={handleOnEnter}
        errorMessage={errorMessage}
        required={true}
      />
    </div>
  );
}
