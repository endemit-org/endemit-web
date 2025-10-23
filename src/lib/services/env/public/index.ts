export const PUBLIC_API_PATH = process.env.NEXT_PUBLIC_API_PATH!;
export const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL!;
export const PUBLIC_BASE_WEB_URL = process.env.NEXT_PUBLIC_BASE_WEB_URL!;
export const PUBLIC_CURRENT_ENV = process.env.NEXT_PUBLIC_CURRENT_ENV!;
export const PUBLIC_VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV!;

// Stripe
export const PUBLIC_STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

// Validation
if (!PUBLIC_API_URL) throw new Error("Missing NEXT_PUBLIC_API_URL");
if (!PUBLIC_STRIPE_PUBLISHABLE_KEY)
  throw new Error("Missing STRIPE_PUBLISHABLE_KEY");
