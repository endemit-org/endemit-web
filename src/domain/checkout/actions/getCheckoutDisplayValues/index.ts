export function getCheckoutDisplayValues<
  T extends Record<string, string | boolean>,
>(isClient: boolean, values: T, defaults: T): T {
  if (!isClient) return defaults;
  return values;
}
