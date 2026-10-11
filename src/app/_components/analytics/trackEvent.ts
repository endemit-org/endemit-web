import {
  TrackedEvent,
  type TrackedEventData,
  type TrackedEventName,
} from "@/lib/services/tracking/events";
import { trackMetaEvent } from "@/app/_components/analytics/metaPixelClient";
import { trackTikTokEvent } from "@/app/_components/analytics/tiktokPixelClient";

/**
 * The single browser-side entry point for advertising events.
 *
 * Components describe what the customer did, once, in platform-agnostic
 * terms; this fans it out to every ad platform that is configured. Each
 * platform sender is responsible for its own gating, event naming and payload
 * shape, so adding a platform means adding one line here and no change in any
 * component.
 *
 * `eventId` is the cross-platform deduplication key. Pass the same value the
 * server sends for the same action — both Meta and TikTok keep the first
 * event of a matching pair and discard the second.
 */
export function trackEvent(
  event: TrackedEventName,
  data?: TrackedEventData,
  eventId?: string
): void {
  trackMetaEvent(event, data, eventId);
  trackTikTokEvent(event, data, eventId);
}

export function trackPageView(): void {
  trackEvent(TrackedEvent.PAGE_VIEW);
}
