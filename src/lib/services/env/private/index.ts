import "server-only";

// Database
export const DATABASE_URL = process.env.DATABASE_URL!;

// Discord Webhooks
export const DISCORD_NEWSLETTER_WEBHOOK =
  process.env.DISCORD_NEWSLETTER_WEBHOOK!;
export const DISCORD_APPLE_WALLET_WEBHOOK =
  process.env.DISCORD_APPLE_WALLET_WEBHOOK!;
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
export const DISPATCHER_EMAIL_ADDRESS = process.env.EMAIL_SHIPPING_ORDER_TO!;

// Auth
export const STAGING_PASSWORD = process.env.STAGING_PASSWORD!;

// Stripe
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY!;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

// Tickets
export const TICKET_SECRET = process.env.TICKET_SECRET!;
export const TICKET_VERIFICATION_HASH_SPLIT_CONFIG =
  process.env.TICKET_VERIFICATION_HASH_SPLIT_CONFIG!;

// Supabase
export const SUPABASE_PRIVATE_KEY = process.env.SUPABASE_PRIVATE_KEY!;

// POS
export const POS_ORDER_SECRET = process.env.POS_ORDER_SECRET!;
export const POS_ORDER_HASH_SPLIT_CONFIG =
  process.env.POS_ORDER_HASH_SPLIT_CONFIG!;
export const DISCORD_POS_WEBHOOK = process.env.DISCORD_POS_WEBHOOK;

// Wallet
export const WALLET_RECEIVE_SECRET = process.env.WALLET_RECEIVE_SECRET!;

// Vercel
export const VERCEL_OIDC_TOKEN = process.env.VERCEL_OIDC_TOKEN!;
export const VERCEL_DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL;
// REST API access for the admin deploy dashboard (deployment listing).
// Create a token at vercel.com/account/tokens; all three optional — the
// dashboard shows a "not configured" notice without them.
export const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
export const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
export const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
// System env var injected by Vercel: the git branch this deployment was built
// from (e.g. "main" in production, "staging" on the staging env). Undefined
// in local dev.
export const VERCEL_GIT_COMMIT_REF = process.env.VERCEL_GIT_COMMIT_REF;

// FURS fiscal verification (ZDavPR) — all optional until fiscalization is
// enabled on a register
export const FURS_CERT_P12_BASE64 = process.env.FURS_CERT_P12_BASE64;
export const FURS_CERT_PASSPHRASE = process.env.FURS_CERT_PASSPHRASE;
export const FURS_TAX_NUMBER = process.env.FURS_TAX_NUMBER;
export const FURS_PREMISE_ID = process.env.FURS_PREMISE_ID;
export const FURS_DEVICE_ID = process.env.FURS_DEVICE_ID;
export const FURS_ENV = process.env.FURS_ENV; // "test" | "prod"
export const FURS_TLS_CA_BASE64 = process.env.FURS_TLS_CA_BASE64;

// Shared secret in the Epson Server Direct Print poll URL
export const POS_PRINT_TOKEN = process.env.POS_PRINT_TOKEN;

// Apple Wallet signing
export const APPLE_PASS_CERTIFICATE = process.env.APPLE_PASS_CERTIFICATE!;
export const APPLE_PASS_CERTIFICATE_PASSWORD =
  process.env.APPLE_PASS_CERTIFICATE_PASSWORD!;
export const APPLE_WWDR_CERTIFICATE = process.env.APPLE_WWDR_CERTIFICATE!;

// Feature flags
export const FEAT_IGNORE_VISIBILITY =
  process.env.FEAT_IGNORE_VISIBILITY === "true";

// Validation
if (!DATABASE_URL) throw new Error("Missing DATABASE_URL");
if (!STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
if (!STRIPE_WEBHOOK_SECRET) throw new Error("Missing STRIPE_WEBHOOK_SECRET");
if (!WALLET_RECEIVE_SECRET) throw new Error("Missing WALLET_RECEIVE_SECRET");
