import {
  MetaEvent,
  type MetaCustomData,
  type MetaEventName,
} from "@/lib/services/meta/events";
import { isMetaPixelEnabled } from "@/lib/services/meta/enabled";

/**
 * Browser-side helpers for the Meta Pixel.
 *
 * Call sites use `trackMetaEvent` and never touch `window.fbq` directly, so a
 * disabled environment, a blocked script or a missing pixel id degrades to a
 * no-op instead of a runtime error in the middle of a checkout flow.
 */

type Fbq = ((...args: unknown[]) => void) & { queue?: unknown[] };

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

function getFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isMetaPixelEnabled()) return undefined;
  return window.fbq;
}

/**
 * Fires a standard event.
 *
 * `eventId` is the deduplication key: pass the same value the server sends to
 * the Conversions API for the same action, otherwise Meta counts it twice.
 */
export function trackMetaEvent(
  eventName: MetaEventName,
  customData?: MetaCustomData,
  eventId?: string
): void {
  const fbq = getFbq();
  if (!fbq) return;

  try {
    if (eventId) {
      fbq("track", eventName, customData ?? {}, { eventID: eventId });
    } else {
      fbq("track", eventName, customData ?? {});
    }
  } catch (error) {
    // Analytics must never break a user flow, least of all checkout.
    console.error("Meta Pixel track failed", { eventName, error });
  }
}

export function trackMetaPageView(): void {
  trackMetaEvent(MetaEvent.PAGE_VIEW);
}
