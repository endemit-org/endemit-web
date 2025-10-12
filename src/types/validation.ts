export interface ValidationErrors {
  email: boolean;
  emailRepeat: boolean;
  name: boolean;
  address: boolean;
  city: boolean;
  postalCode: boolean;
  country: boolean;
  phone: boolean;
  termsAndConditions: boolean;
  complementaryTicketData: { [x: string]: string | boolean } | null;
}
