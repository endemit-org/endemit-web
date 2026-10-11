import "server-only";

import {
  TIKTOK_EVENTS_API_ACCESS_TOKEN,
  TIKTOK_PIXEL_ID,
  TIKTOK_TEST_EVENT_CODE,
} from "@/lib/services/env/private";
import { isProduction } from "@/lib/util/env";
import type {
  TrackedEventData,
  TrackedEventName,
} from "@/lib/services/tracking/events";
import {
  normalizeCountry,
  normalizeEmail,
  normalizePhoneDigits,
  sha256Hex,
  toE164,
  type TrackedUserData,
} from "@/lib/services/tracking/normalize";
import {
  toTikTokEventName,
  toTikTokProperties,
} from "@/lib/services/tiktok/events";

const EVENTS_API_URL =
  "https://business-api.tiktok.com/open_api/v1.3/event/track/";

/**
 * Server-side TikTok Events API sender, used only by the web store checkout
 * flow. POS orders, gate scans and wallet movements are deliberately out of
 * scope, matching the Meta integration.
 *
 * TikTok deduplicates on (pixel id, event name, `event_id`) within 48 hours,
 * keeping the first event it sees and discarding the duplicate. So every
 * event sent from here must also be sent from the browser pixel with the same
 * name and `event_id`, or the conversion is counted twice.
 */

export interface SendTikTokEventParams {
  event: TrackedEventName;
  /** Must match the browser event's `event_id` exactly. */
  eventId: string;
  /** Unix seconds. Defaults to now. */
  eventTime?: number;
  eventSourceUrl?: string | null;
  referrer?: string | null;
  userData: TrackedUserData;
  data?: TrackedEventData;
}

/**
 * Whether server-side events may be sent.
 *
 * Production with both secrets present is the normal case. A non-production
 * environment sends only when `TIKTOK_TEST_EVENT_CODE` is deliberately set,
 * because TikTok then routes the event to Test Events and keeps it out of
 * reporting — the only safe way to verify the wiring before launch. With no
 * TikTok variables configured, every environment stays silent.
 */
function canSendServerEvents(): boolean {
  if (!TIKTOK_EVENTS_API_ACCESS_TOKEN || !TIKTOK_PIXEL_ID) return false;
  return isProduction() || Boolean(TIKTOK_TEST_EVENT_CODE);
}

/**
 * TikTok's `user` object.
 *
 * Unlike Meta, TikTok expects each hashed identifier as a single hex string
 * rather than an array, and wants the phone number in E.164 form (with the
 * leading "+") before hashing. `ttclid`, `ttp`, the IP and the user agent are
 * sent unhashed — TikTok requires them raw.
 */
function buildUser(userData: TrackedUserData): Record<string, unknown> {
  const user: Record<string, unknown> = {};

  const email = normalizeEmail(userData.email);
  if (email) user.email = sha256Hex(email);

  const phone = toE164(normalizePhoneDigits(userData.phone));
  if (phone) user.phone = sha256Hex(phone);

  if (userData.externalId) {
    user.external_id = sha256Hex(userData.externalId.trim().toLowerCase());
  }

  const country = normalizeCountry(userData.country);
  if (country) user.country = country;

  if (userData.ttclid) user.ttclid = userData.ttclid;
  if (userData.ttp) user.ttp = userData.ttp;
  if (userData.clientIpAddress) user.ip = userData.clientIpAddress;
  if (userData.clientUserAgent) user.user_agent = userData.clientUserAgent;

  return user;
}

/**
 * Sends one event to the TikTok Events API.
 *
 * Never throws: ad reporting must not be able to fail a paid order. Failures
 * are logged and returned so the caller (an Inngest step) can record them
 * without retrying the whole payment flow.
 *
 * TikTok answers HTTP 200 even for rejected payloads and signals the problem
 * in the body's `code` field (0 means success), so the status alone is not a
 * success check.
 */
export async function sendTikTokEvent({
  event,
  eventId,
  eventTime,
  eventSourceUrl,
  referrer,
  userData,
  data,
}: SendTikTokEventParams): Promise<{ sent: boolean; reason?: string }> {
  if (!canSendServerEvents()) {
    return { sent: false, reason: "tiktok events api disabled" };
  }

  const eventName = toTikTokEventName(event);
  if (!eventName) {
    return { sent: false, reason: `no tiktok equivalent for ${event}` };
  }

  const eventPayload: Record<string, unknown> = {
    event: eventName,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    user: buildUser(userData),
  };

  const properties = toTikTokProperties(data);
  if (properties) eventPayload.properties = properties;

  if (eventSourceUrl) {
    eventPayload.page = {
      url: eventSourceUrl,
      ...(referrer ? { referrer } : {}),
    };
  }

  const body: Record<string, unknown> = {
    event_source: "WEB",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [eventPayload],
  };
  if (TIKTOK_TEST_EVENT_CODE) {
    body.test_event_code = TIKTOK_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(EVENTS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": TIKTOK_EVENTS_API_ACCESS_TOKEN!,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("TikTok Events API request rejected", {
        event: eventName,
        eventId,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return { sent: false, reason: `http ${response.status}` };
    }

    // A non-zero `code` is a rejected payload delivered with HTTP 200.
    const result = (await response.json()) as {
      code?: number;
      message?: string;
    };
    if (result.code !== 0) {
      console.error("TikTok Events API returned an error", {
        event: eventName,
        eventId,
        code: result.code,
        message: result.message,
      });
      return { sent: false, reason: `code ${result.code}: ${result.message}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("TikTok Events API request failed", {
      event: eventName,
      eventId,
      error,
    });
    return { sent: false, reason: String(error) };
  }
}
