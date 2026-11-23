/**
 * Wrong-code attempts allowed per sign-in code. The code is short (2 letters
 * + 2 digits, 57,600 combinations), so this cap is what makes it safe.
 * A locked code stops verifying; its emailed magic link keeps working.
 */
export const MAX_OTC_ATTEMPTS = 5;
