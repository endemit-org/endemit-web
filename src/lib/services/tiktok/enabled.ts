import { PUBLIC_TIKTOK_PIXEL_ID } from "@/lib/services/env/public";
import { isProduction } from "@/lib/util/env";

/**
 * Two independent kill switches, matching the Meta gate:
 *
 *  1. environment — tracking runs on production only, so development,
 *     staging and preview deploys never feed test orders or QA clicks into
 *     ad optimization;
 *  2. configuration — a missing pixel id disables the browser side on its
 *     own, so the code ships inert until a TikTok account exists.
 *
 * Nothing here throws on a missing variable, unlike the required variables
 * validated in the env service.
 */
export function isTikTokPixelEnabled(): boolean {
  return isProduction() && PUBLIC_TIKTOK_PIXEL_ID.length > 0;
}
