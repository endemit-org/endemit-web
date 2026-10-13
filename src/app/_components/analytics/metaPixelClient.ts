import { toMetaCustomData, toMetaEventName } from "@/lib/services/meta/events";
import { isMetaPixelEnabled } from "@/lib/services/meta/enabled";
import type {
  TrackedEventData,
  TrackedEventName,
} from "@/lib/services/tracking/events";

/**
 * Browser-side Meta Pixel sender.
 *
 * Reached through the platform-agnostic dispatcher in `trackEvent`, never
 * called directly from a component, so a disabled environment, a blocked
 * script or a missing pixel id degrades to a no-op instead of a runtime error
 * in the middle of a checkout flow.
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
 * Fires a standard Meta event.
 *
 * `eventId` is the deduplication key: pass the same value the server sends to
 * the Conversions API for the same action, otherwise Meta counts it twice.
 */
export function trackMetaEvent(
  event: TrackedEventName,
  data?: TrackedEventData,
  eventId?: string
): void {
  const fbq = getFbq();
  if (!fbq) return;

  const eventName = toMetaEventName(event);
  if (!eventName) return;

  try {
    const customData = toMetaCustomData(data) ?? {};
    if (eventId) {
      fbq("track", eventName, customData, { eventID: eventId });
    } else {
      fbq("track", eventName, customData);
    }
  } catch (error) {
    // Analytics must never break a user flow, least of all checkout.
    console.error("Meta Pixel track failed", { event, error });
  }
}
