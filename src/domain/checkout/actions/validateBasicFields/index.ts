export const validateBasicFields = (
  email: string | undefined,
  termsAndConditions: boolean | undefined
) => {
  if (!email) throw new Error("Email is required");
  if (!termsAndConditions) {
    throw new Error("Terms and conditions must be accepted");
  }
};
