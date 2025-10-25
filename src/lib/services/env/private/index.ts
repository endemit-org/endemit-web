import "server-only";

// Database
export const DATABASE_URL = process.env.DATABASE_URL!;

// Discord Webhooks
export const DISCORD_NEWSLETTER_WEBHOOK =
  process.env.DISCORD_NEWSLETTER_WEBHOOK!;
export const DISCORD_ORDERS_WEBHOOK = process.env.DISCORD_ORDERS_WEBHOOK!;
export const DISCORD_TICKET_PURCHASE_WEBHOOK =
  process.env.DISCORD_TICKET_PURCHASE_WEBHOOK!;
export const DISCORD_TICKET_SCAN_WEBHOOK =
  process.env.DISCORD_TICKET_SCAN_WEBHOOK!;

// Email Octopus
export const EMAIL_OCTOPUS_API_KEY = process.env.EMAIL_OCTOPUS_API_KEY!;
export const EMAIL_OCTOPUS_FESTIVAL_LIST_ID =
  process.env.EMAIL_OCTOPUS_FESTIVAL_LIST_ID!;
export const EMAIL_OCTOPUS_GENERAL_LIST_ID =
  process.env.EMAIL_OCTOPUS_GENERAL_LIST_ID!;
export const EMAIL_OCTOPUS_TICKET_BUYERS_LIST_ID =
  process.env.EMAIL_OCTOPUS_TICKET_BUYERS_LIST_ID!;

// Inngest
export const INNGEST_EVENT_KEY = process.env.INNGEST_EVENT_KEY!;

// Prismic
export const PRISMIC_ACCESS_TOKEN = process.env.PRISMIC_ACCESS_TOKEN!;
export const PRISMIC_REPOSITORY_NAME = process.env.PRISMIC_REPOSITORY_NAME!;

// Resend
export const RESEND_FROM = process.env.RESEND_FROM!;
export const RESEND_KEY = process.env.RESEND_KEY!;
export const MERCHANT_EMAIL_ADDRESS = process.env.EMAIL_ORDER_COPY_TO!;

// Auth
export const STAGING_PASSWORD = process.env.STAGING_PASSWORD!;

// Stripe
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Tickets
export const TICKET_SECRET = process.env.TICKET_SECRET!;
export const TICKET_VERIFICATION_HASH_SPLIT_CONFIG =
  process.env.TICKET_VERIFICATION_HASH_SPLIT_CONFIG!;

// Vercel
export const VERCEL_OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN!;

// Validation
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
