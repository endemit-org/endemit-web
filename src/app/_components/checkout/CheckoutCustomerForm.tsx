import Input from "@/app/_components/form/Input";
import CountrySelect from "@/app/_components/form/CountrySelect";
import CheckboxInput from "@/app/_components/form/CheckboxInput";
import Link from "next/link";
import { CheckoutFormData } from "@/domain/checkout/types/checkout";
import CheckoutTicketForm from "@/app/_components/checkout/CheckoutTicketForm";
import { includesTicketProducts } from "@/domain/checkout/businessRules";
import { isProductTicket } from "@/domain/product/businessLogic";
import { getCountry } from "@/domain/checkout/actions/getCountry";
import { CartItem } from "@/domain/checkout/types/cartItem";

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
  requiresShippingAddress: boolean;
  includesNonRefundable: boolean;
  showSubscribeToNewsletter: boolean;
  validateForm: (type: "manual" | "auto") => void;
  items: CartItem[];
  validationTriggered: boolean;
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
  requiresShippingAddress,
  includesNonRefundable,
  showSubscribeToNewsletter,
  validateForm,
  validationTriggered,
}: CheckoutFormProps) {
  const destinationCountry = getCountry(formData.country);
  const includesTickets = includesTicketProducts(items);
  const ticketItems = items.filter(item => isProductTicket(item));

  const handleValidateForm = () => {
    validateForm("manual");
  };

  return (
    <div className="gap-y-8 flex flex-col">
      <CheckoutFormSection
        title={"Your contact information"}
        description={`Ensure your email is correct as this is where you will receive your order
          confirmation${includesTickets ? " and digital tickets" : ""}.`}
      >
        <Input
          name="email"
          label="E-mail"
          type="email"
          placeholder="jane@endemit.org"
          value={formData.email}
          onChangeAction={onFormChangeAction}
          onEnter={handleValidateForm}
          errorMessage={errorMessages.email as string}
          required={true}
          validationTriggered={validationTriggered}
        />
        <Input
          name="emailRepeat"
          label="Repeat e-mail"
          type="email"
          placeholder="jane@endemit.org"
          value={formData.emailRepeat}
          onChangeAction={onFormChangeAction}
          onEnter={handleValidateForm}
          errorMessage={errorMessages.emailRepeat as string}
          required={true}
          validationTriggered={validationTriggered}
        />
      </CheckoutFormSection>

      {includesTickets && ticketItems.length > 0 && (
        <CheckoutFormSection
          title={"Ticket holder information"}
          description={`As a backup for lost tickets or inability to scan at the event, please provide the name of each ticket holder:`}
        >
          {ticketItems.map(item => (
            <div key={`ticket-data-${item.id}}`}>
              {new Array(item.quantity).fill(0).map((_, index) => (
                <CheckoutTicketForm
                  key={`${item.id}-${index}`}
                  index={index}
                  item={item}
                  formData={formData}
                  errorMessages={errorMessages}
                  onFormChangeAction={onTicketFormChange}
                  onEnter={handleValidateForm}
                  validationTriggered={validationTriggered}
                />
              ))}
            </div>
          ))}
        </CheckoutFormSection>
      )}

      {requiresShippingAddress && (
        <CheckoutFormSection
          title={"Shipping information"}
          description={`Please provide your shipping address where we will send your order.`}
        >
          <Input
            name="name"
            label="Full Name"
            type="text"
            value={formData.name}
            onChangeAction={onFormChangeAction}
            onEnter={handleValidateForm}
            errorMessage={errorMessages.name as string}
            required={true}
            placeholder="Jane Demit"
            validationTriggered={validationTriggered}
          />
          <Input
            name="address"
            label="Address"
            type="text"
            value={formData.address}
            onChangeAction={onFormChangeAction}
            onEnter={handleValidateForm}
            errorMessage={errorMessages.address as string}
            required={true}
            placeholder="Road to forever 42"
            validationTriggered={validationTriggered}
          />
          <div className={"flex gap-x-4"}>
            <Input
              name="postalCode"
              label="Postal Code"
              type="text"
              value={formData.postalCode}
              onChangeAction={onFormChangeAction}
              onEnter={handleValidateForm}
              errorMessage={errorMessages.postalCode as string}
              required={true}
              placeholder="2390"
              validationTriggered={validationTriggered}
            />
            <Input
              name="city"
              label="City"
              type="text"
              value={formData.city}
              onChangeAction={onFormChangeAction}
              onEnter={handleValidateForm}
              errorMessage={errorMessages.city as string}
              required={true}
              placeholder="Ravne na Koroškem"
              validationTriggered={validationTriggered}
            />
          </div>
          <CountrySelect
            name="country"
            label="Country"
            onChangeAction={onFormChangeAction}
            value={formData.country}
            errorMessage={errorMessages.country as string}
            required={true}
          />
          <div className="text-neutral-400 text-sm">
            Is your country not listed? Please{" "}
            <Link href="mailto:endemit@endemit.org" className={"link"}>
              contact us
            </Link>
            .
          </div>

          <Input
            name="phone"
            label="Phone"
            type="text"
            autoComplete="off"
            placeholder="30 111 222"
            value={formData.phone}
            onChangeAction={onFormChangeAction}
            onEnter={handleValidateForm}
            errorMessage={errorMessages.phone as string}
            required={true}
            prefix={destinationCountry.callingCode as string}
            validationTriggered={validationTriggered}
          />
          {formData.phone && !errorMessages.phone && (
            <div className="text-neutral-400 text-sm">
              We will reach you at {destinationCountry.callingCode}{" "}
              {formData.phone}
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
            I confirm the order, accept and agree to the{" "}
            <Link
              target="_blank"
              className="link"
              href={"/terms-and-conditions"}
            >
              Terms and conditions
            </Link>
            ,{" "}
            <Link target="_blank" className="link" href={"/privacy-policy"}>
              Privacy policy
            </Link>
            , and{" "}
            <Link
              target="_blank"
              className="link"
              href={"/right-to-withdrawal"}
            >
              Right to withdrawal
            </Link>
            .
          </div>
          {includesNonRefundable && (
            <div>
              I understand and accept that my order contains non refundable
              items as stated in{" "}
              <Link
                target="_blank"
                className="link"
                href={"/notice-on-purchase-of-digital-products"}
              >
                Notice on purchase of digital products
              </Link>
              .
            </div>
          )}
          {includesTickets && (
            <div>
              I understand, accept and will respect the applicable{" "}
              <Link target="_blank" className="link" href={"/code-of-conduct"}>
                Code of conduct
              </Link>{" "}
              at Endemit events.
            </div>
          )}
        </div>
      </CheckboxInput>

      {showSubscribeToNewsletter && (
        <CheckboxInput
          value={formData.subscribeToNewsletter}
          name="subscribeToNewsletter"
          onChangeAction={onFormChangeAction}
          required={false}
          validationTriggered={validationTriggered}
        >
          I would like to receive an occasional endemit newsletter with updates
          on new events and offers.
        </CheckboxInput>
      )}
    </div>
  );
}
