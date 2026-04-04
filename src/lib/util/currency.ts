/**
 * Token currency formatting utilities
 *
 * Used for user-facing wallet/transaction/POS displays.
 * Admin interfaces continue to use EUR formatting from formatting.ts
 */

export const TOKEN_CONFIG = {
  symbol: "ǝŧ",
  name: "tokens",
  decimals: 2,
  locale: "sl-SI",
} as const;

/**
 * Format a number as tokens (amount in whole units, e.g., 10.50)
 * @param amount - Amount in whole token units
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string like "10,50ǝe"
 */
export function formatTokens(
  amount: number,
  decimals: number = TOKEN_CONFIG.decimals
): string {
  const formatted = amount.toLocaleString(TOKEN_CONFIG.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${TOKEN_CONFIG.symbol}`;
}

/**
 * Format cents as tokens (amount in cents, e.g., 1050 = 10.50 tokens)
 * @param cents - Amount in cents
 * @returns Formatted string like "10,50ǝe"
 */
export function formatTokensFromCents(cents: number): string {
  return formatTokens(cents / 100);
}

/**
 * Get the token currency name
 * @param plural - Whether to return plural form (default: true)
 * @returns "tokens" or "token"
 */
export function getTokenName(plural: boolean = true): string {
  return plural ? TOKEN_CONFIG.name : "token";
}
