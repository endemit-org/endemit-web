import ActionButton from "@/app/_components/form/ActionButton";
import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";

interface CheckoutActionsProps {
  onCheckout: () => void;
  canProceed: boolean;
  isProcessing: boolean;
  errorMessages: Record<
    string,
    | string
    | {
        [p: string]: string;
      }
    | undefined
  >;
}

export default function CheckoutActions({
  onCheckout,
  canProceed,
  isProcessing,
  errorMessages,
}: CheckoutActionsProps) {
  const t = useTranslations("checkout.actions");
  const remainingFields = Object.keys(errorMessages).length;

  return (
    <div className="mt-6 space-y-2">
      <ActionButton
        onClick={canProceed ? onCheckout : undefined}
        disabled={!canProceed}
        variant="success"
        className={clsx(
          canProceed && "animate-rave-125bmp-delay hover:[animation:none]"
        )}
      >
        {isProcessing && canProceed
          ? t("redirecting")
          : t("payWithStripe")}
      </ActionButton>
      {!canProceed && (
        <div className={"text-neutral-400 text-sm text-center"}>
          {t.rich("fillRequired", {
            count: remainingFields,
            strong: chunks => <strong>{chunks}</strong>,
          })}
        </div>
      )}
      <div className="text-center w-full pt-4">
        <Image
          src="/images/powered-by-stripe.png"
          alt={t("poweredByStripe")}
          className="inline"
          width={180}
          height={44}
        />
      </div>
    </div>
  );
}
