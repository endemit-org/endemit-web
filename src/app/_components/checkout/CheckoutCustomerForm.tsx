import Input from "@/app/_components/form/Input";
import CountrySelect from "@/app/_components/form/CountrySelect";
import CheckboxInput from "@/app/_components/form/CheckboxInput";
import { Link } from "@/i18n/navigation";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import CheckoutTicketForm from "@/app/_components/checkout/CheckoutTicketForm";
import { includesTicketProducts } from "@/domain/checkout/businessRules";
import {
  isProductTicket,
  getTicketQuantityForProduct,
} from "@/domain/product/businessLogic";
import { getCountry } from "@/domain/checkout/actions/getCountry";
import { CartItem } from "@/domain/checkout/types/cartItem";
import { useTranslations } from "next-intl";

interface CheckoutFormProps {
  formData: CheckoutFormData;
  errorMessages: Record<
    string,
    | string
    | {
        [p: string]: string;
      }
    | undefined
  >;
  onFormChangeAction: (name: string, value: string | boolean) => void;
  onTicketFormChange: (name: string, value: string) => void;
  onIncrementItem: (productId: string) => void;
  onDecrementItem: (productId: string) => void;
  onRemoveItem: (productId: string) => void;
  requiresShippingAddress: boolean;
  includesNonRefundable: boolean;
  validateForm: (type: "manual" | "auto") => boolean;
  submitForm: () => void;
  items: CartItem[];
  validationTriggered: boolean;
  userEmail?: string;
}

function CheckoutFormSection({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-600 pb-8 border-dotted">
      <h2 className=" font-medium mb-3 text-2xl text-neutral-200">{title}</h2>
      {description && (
        <div className=" font-normal mb-3 text-sm text-neutral-400">
          {description}
        </div>
      )}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function CheckoutCustomerForm({
  items,
  formData,
  errorMessages,
  onFormChangeAction,
  onTicketFormChange,
  onIncrementItem,
  onDecrementItem,
  onRemoveItem,
  requiresShippingAddress,
  includesNonRefundable,
  validateForm,
  validationTriggered,
  submitForm,
  userEmail,
}: CheckoutFormProps) {
  const t = useTranslations("checkout.customer");
  const destinationCountry = getCountry(formData.country);
  const includesTickets = includesTicketProducts(items);
  const ticketItems = items.filter(item => isProductTicket(item));

  const handleOnEnter = () => {
    const formValidation = validateForm("manual");
    if (formValidation) {
      submitForm();
    }
    return formValidation;
  };

  return (
    <div className="gap-y-8 flex flex-col">
      <CheckoutFormSection
        title={t("contactInfo.title")}
        description={
          userEmail
            ? t("contactInfo.signedIn")
            : includesTickets
              ? t("contactInfo.descriptionWithTickets")
              : t("contactInfo.description")
        }
      >
        <Input
          name="email"
          label={t("email")}
          type="email"
          placeholder={t("emailPlaceholder")}
          value={userEmail || formData.email}
          onChangeAction={onFormChangeAction}
          onEnter={handleOnEnter}
          errorMessage={userEmail ? undefined : (errorMessages.email as string)}
          required={true}
          validationTriggered={validationTriggered}
          disabled={!!userEmail}
        />
        {!userEmail && (
          <Input
            name="emailRepeat"
            label={t("emailRepeat")}
            type="email"
            placeholder={t("emailPlaceholder")}
            value={formData.emailRepeat}
            onChangeAction={onFormChangeAction}
            onEnter={handleOnEnter}
            errorMessage={errorMessages.emailRepeat as string}
            required={true}
            validationTriggered={validationTriggered}
          />
        )}
      </CheckoutFormSection>

      {includesTickets && ticketItems.length > 0 && (
        <CheckoutFormSection
          title={t("ticketHolder.title")}
          description={t("ticketHolder.description")}
        >
          {ticketItems.map(item => {
            const ticketQuantity = getTicketQuantityForProduct(item);
            const totalSlots = item.quantity * ticketQuantity;
            return (
              <div key={`ticket-data-${item.id}}`} className="mb-4">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-700">
                  <span className="text-sm text-neutral-300">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDecrementItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-blue-900 hover:bg-blue-800 text-neutral-200 transition-colors"
                      aria-label={t("decreaseQuantity")}
                    >
                      −
                    </button>
                    <span className="text-sm text-neutral-200 w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onIncrementItem(item.id)}
                      className="w-7 h-7 flex items-center justify-center rounded bg-blue-900 hover:bg-blue-800 text-neutral-200 transition-colors"
                      aria-label={t("increaseQuantity")}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="ml-2 text-neutral-500 hover:text-red-400 text-sm transition-colors"
                      aria-label={t("removeTicket")}
                    >
                      {t("remove")}
                    </button>
                  </div>
                </div>
                {new Array(totalSlots).fill(0).map((_, index) => (
                  <CheckoutTicketForm
                    key={`${item.id}-${index}`}
                    index={index}
                    item={item}
                    formData={formData}
                    errorMessages={errorMessages}
                    onFormChangeAction={onTicketFormChange}
                    onEnter={handleOnEnter}
                    validationTriggered={validationTriggered}
                  />
                ))}
              </div>
            );
          })}
        </CheckoutFormSection>
      )}

      {requiresShippingAddress && (
        <CheckoutFormSection
          title={t("shipping.title")}
          description={t("shipping.description")}
        >
          <Input
            name="name"
            label={t("fullName")}
            type="text"
            value={formData.name}
            onChangeAction={onFormChangeAction}
            onEnter={handleOnEnter}
            errorMessage={errorMessages.name as string}
            required={true}
            placeholder={t("fullNamePlaceholder")}
            validationTriggered={validationTriggered}
          />
          <Input
            name="address"
            label={t("address")}
            type="text"
            value={formData.address}
            onChangeAction={onFormChangeAction}
            onEnter={handleOnEnter}
            errorMessage={errorMessages.address as string}
            required={true}
            placeholder={t("addressPlaceholder")}
            validationTriggered={validationTriggered}
          />
          <div className={"flex gap-x-4"}>
            <Input
              name="postalCode"
              label={t("postalCode")}
              type="text"
              value={formData.postalCode}
              onChangeAction={onFormChangeAction}
              onEnter={handleOnEnter}
              errorMessage={errorMessages.postalCode as string}
              required={true}
              placeholder={t("postalCodePlaceholder")}
              validationTriggered={validationTriggered}
            />
            <Input
              name="city"
              label={t("city")}
              type="text"
              value={formData.city}
              onChangeAction={onFormChangeAction}
              onEnter={handleOnEnter}
              errorMessage={errorMessages.city as string}
              required={true}
              placeholder="Ravne na Koroškem"
              validationTriggered={validationTriggered}
            />
          </div>
          <CountrySelect
            name="country"
            label={t("country")}
            onChangeAction={onFormChangeAction}
            value={formData.country}
            errorMessage={errorMessages.country as string}
            required={true}
          />
          <div className="text-neutral-400 text-sm">
            {t.rich("countryNotListed", {
              contact: chunks => (
                <Link href="mailto:endemit@endemit.org" className={"link"}>
                  {chunks}
                </Link>
              ),
            })}
          </div>

          <Input
            name="phone"
            label={t("phone")}
            type="text"
            autoComplete="off"
            placeholder={t("phonePlaceholder")}
            value={formData.phone}
            onChangeAction={onFormChangeAction}
            onEnter={handleOnEnter}
            errorMessage={errorMessages.phone as string}
            required={true}
            prefix={destinationCountry.callingCode as string}
            validationTriggered={validationTriggered}
          />
          {formData.phone && !errorMessages.phone && (
            <div className="text-neutral-400 text-sm">
              {t("reachYou", {
                code: destinationCountry.callingCode,
                phone: formData.phone,
              })}
            </div>
          )}
        </CheckoutFormSection>
      )}

      <CheckboxInput
        errorMessage={errorMessages.termsAndConditions as string}
        value={formData.termsAndConditions}
        name="termsAndConditions"
        onChangeAction={onFormChangeAction}
        required={true}
        validationTriggered={validationTriggered}
      >
        <div className={"flex flex-col gap-y-4 flex-1"}>
          <div>
            {t.rich("consent.terms", {
              terms: chunks => (
                <Link
                  target="_blank"
                  className="link"
                  href={"/terms-and-conditions"}
                >
                  {chunks}
                </Link>
              ),
              privacy: chunks => (
                <Link target="_blank" className="link" href={"/privacy-policy"}>
                  {chunks}
                </Link>
              ),
              withdrawal: chunks => (
                <Link
                  target="_blank"
                  className="link"
                  href={"/right-to-withdrawal"}
                >
                  {chunks}
                </Link>
              ),
            })}
          </div>
          {includesNonRefundable && (
            <div>
              {t.rich("consent.nonRefundable", {
                notice: chunks => (
                  <Link
                    target="_blank"
                    className="link"
                    href={"/notice-on-purchase-of-digital-products"}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </div>
          )}
          {includesTickets && (
            <div>
              {t.rich("consent.codeOfConduct", {
                code: chunks => (
                  <Link
                    target="_blank"
                    className="link"
                    href={"/code-of-conduct"}
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </div>
          )}
        </div>
      </CheckboxInput>

    </div>
  );
}
