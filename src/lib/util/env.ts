import {
  PUBLIC_CURRENT_ENV,
  PUBLIC_VERCEL_ENV,
} from "@/lib/services/env/public";

export const isProduction = () => {
  return PUBLIC_CURRENT_ENV === "production";
};

export const isStaging = () => {
  return PUBLIC_CURRENT_ENV === "staging";
};

export const isDevelopment = () => {
  return PUBLIC_CURRENT_ENV === "development";
};

export const isPreview = () => {
  return PUBLIC_VERCEL_ENV === "preview" || PUBLIC_VERCEL_ENV === "staging";
};

const STRIPE_DEVTOOLS_COOKIE = "stripe_devtools";

/**
 * Whether Stripe's built-in dev assistant (test-card autofill panel) should
 * render. Browser-only — reads document.cookie.
 *  - dev: always on
 *  - staging: only when the `stripe_devtools=1` cookie is set
 *  - prod: never
 */
export const shouldShowStripeDevtools = (): boolean => {
  if (isProduction()) return false;
  if (isDevelopment()) return true;
  if (typeof document === "undefined") return false;
  const match = document.cookie
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${STRIPE_DEVTOOLS_COOKIE}=`));
  return match?.split("=")[1] === "1";
};
