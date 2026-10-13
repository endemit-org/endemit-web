import {
  toTikTokEventName,
  toTikTokProperties,
  type TikTokProperties,
} from "@/lib/services/tiktok/events";
import { isTikTokPixelEnabled } from "@/lib/services/tiktok/enabled";
import {
  TrackedEvent,
  type TrackedEventData,
  type TrackedEventName,
} from "@/lib/services/tracking/events";

/**
 * Browser-side TikTok Pixel sender.
 *
 * Reached through the platform-agnostic dispatcher in `trackEvent`, never
 * called directly from a component.
 */

type Ttq = {
  track: (
    event: string,
    properties?: TikTokProperties,
    options?: { event_id?: string }
  ) => void;
  page: () => void;
  load?: (pixelId: string) => void;
};

declare global {
  interface Window {
    ttq?: Ttq;
    TiktokAnalyticsObject?: string;
  }
}

function getTtq(): Ttq | undefined {
  if (typeof window === "undefined") return undefined;
  if (!isTikTokPixelEnabled()) return undefined;
  return window.ttq;
}

/**
 * Fires a standard TikTok event.
 *
 * TikTok deduplicates on (pixel id, event name, `event_id`), so `eventId`
 * must match what the Events API sends for the same action.
 */
export function trackTikTokEvent(
  event: TrackedEventName,
  data?: TrackedEventData,
  eventId?: string
): void {
  const ttq = getTtq();
  if (!ttq) return;

  const eventName = toTikTokEventName(event);
  if (!eventName) return;

  try {
    // Page views go through the SDK's own method, which the pixel treats
    // differently from a tracked conversion event.
    if (event === TrackedEvent.PAGE_VIEW) {
      ttq.page();
      return;
    }

    const properties = toTikTokProperties(data) ?? {};
    if (eventId) {
      ttq.track(eventName, properties, { event_id: eventId });
    } else {
      ttq.track(eventName, properties);
    }
  } catch (error) {
    // Analytics must never break a user flow, least of all checkout.
    console.error("TikTok Pixel track failed", { event, error });
  }
}
