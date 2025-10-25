export type ValidationErrors = {
  email: boolean;
  emailRepeat: boolean;
  name: boolean;
  address: boolean;
  city: boolean;
  postalCode: boolean;
  country: boolean;
  phone: boolean;
  termsAndConditions: boolean;
  [key: string]: boolean; // Dynamic keys for complementary tickets
};
