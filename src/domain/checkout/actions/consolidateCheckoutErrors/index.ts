export function consolidateCheckoutErrors(
  errors: (string | null | undefined)[]
): string | null {
  const firstError = errors.find(err => err != null && err !== "");
  return firstError || null;
}
