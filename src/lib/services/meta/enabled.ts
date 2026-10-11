import { PUBLIC_META_PIXEL_ID } from "@/lib/services/env/public";
import { isProduction } from "@/lib/util/env";

/**
 * Two independent kill switches guard every Meta call:
 *
 *  1. environment — tracking runs on production only, so development,
 *     staging and Vercel preview deploys never send test orders, seeded data
 *     or QA clicks into the ad account's optimization signal;
 *  2. configuration — a missing pixel id or access token disables the
 *     matching side on its own, so an environment that simply has no Meta
 *     secrets stays silent even if it were marked production.
 *
 * Both must pass. That is why nothing here throws on a missing variable, in
 * contrast to the required variables validated in the env service.
 */
export function isMetaPixelEnabled(): boolean {
  return isProduction() && PUBLIC_META_PIXEL_ID.length > 0;
}
