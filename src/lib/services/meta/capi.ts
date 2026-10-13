import "server-only";

import {
  META_CAPI_ACCESS_TOKEN,
  META_CAPI_TEST_EVENT_CODE,
  META_PIXEL_ID,
} from "@/lib/services/env/private";
import { isProduction } from "@/lib/util/env";
import type {
  TrackedEventData,
  TrackedEventName,
} from "@/lib/services/tracking/events";
import {
  normalizeCity,
  normalizeCountry,
  normalizeEmail,
  normalizeName,
  normalizePhoneDigits,
  normalizePostalCode,
  sha256Hex,
  splitName,
  type TrackedUserData,
} from "@/lib/services/tracking/normalize";
import {
  toMetaCustomData,
  toMetaEventName,
} from "@/lib/services/meta/events";

const GRAPH_API_VERSION = "v21.0";

/**
 * Server-side Meta Conversions API sender, used only by the web store
 * checkout flow. POS orders, gate scans and wallet movements are deliberately
 * out of scope: they are on-site operations, not ad-attributable web
 * conversions, and feeding them in would inflate campaign results.
 *
 * Every event sent from here must also be sent from the browser pixel with
 * the same event name and `event_id`, so Meta deduplicates the pair instead
 * of counting the conversion twice.
 */

export interface SendMetaEventParams {
  event: TrackedEventName;
  /** Must match the browser event's `eventID` exactly. */
  eventId: string;
  /** Unix seconds. Defaults to now. Meta rejects events older than 7 days. */
  eventTime?: number;
  eventSourceUrl?: string | null;
  userData: TrackedUserData;
  data?: TrackedEventData;
}

/**
 * Whether server-side events may be sent.
 *
 * Production with both secrets present is the normal case. A non-production
 * environment sends only when `META_CAPI_TEST_EVENT_CODE` is deliberately
 * set, because Meta flags those as test traffic and excludes them from ads
 * reporting and optimization — that is the only safe way to verify the wiring
 * in Events Manager from staging. With no Meta variables configured, every
 * environment stays silent.
 */
function canSendServerEvents(): boolean {
  if (!META_CAPI_ACCESS_TOKEN || !META_PIXEL_ID) return false;
  return isProduction() || Boolean(META_CAPI_TEST_EVENT_CODE);
}

/**
 * Meta's `user_data`. Each hashed identifier is sent as an array of hashes;
 * `fbp`, `fbc`, the IP and the user agent go unhashed, as Meta requires.
 */
function buildUserData(userData: TrackedUserData): Record<string, unknown> {
  const { firstName, lastName } = splitName(userData.name);
  const email = normalizeEmail(userData.email);
  const phone = normalizePhoneDigits(userData.phone);

  const hashed: Record<string, string | undefined> = {
    em: email ? sha256Hex(email) : undefined,
    ph: phone ? sha256Hex(phone) : undefined,
    fn: normalizeName(firstName) && sha256Hex(normalizeName(firstName)!),
    ln: normalizeName(lastName) && sha256Hex(normalizeName(lastName)!),
    ct: normalizeCity(userData.city) && sha256Hex(normalizeCity(userData.city)!),
    zp:
      normalizePostalCode(userData.postalCode) &&
      sha256Hex(normalizePostalCode(userData.postalCode)!),
    country:
      normalizeCountry(userData.country) &&
      sha256Hex(normalizeCountry(userData.country)!),
    external_id: userData.externalId
      ? sha256Hex(userData.externalId.trim().toLowerCase())
      : undefined,
  };

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(hashed)) {
    if (value) payload[key] = [value];
  }

  if (userData.fbp) payload.fbp = userData.fbp;
  if (userData.fbc) payload.fbc = userData.fbc;
  if (userData.clientIpAddress) {
    payload.client_ip_address = userData.clientIpAddress;
  }
  if (userData.clientUserAgent) {
    payload.client_user_agent = userData.clientUserAgent;
  }

  return payload;
}

/**
 * Sends one event to the Conversions API.
 *
 * Never throws: analytics must not be able to fail a paid order's processing.
 * Failures are logged and reported in the return value so the caller (an
 * Inngest step) can record them without retrying the whole payment flow.
 */
export async function sendMetaEvent({
  event,
  eventId,
  eventTime,
  eventSourceUrl,
  userData,
  data,
}: SendMetaEventParams): Promise<{ sent: boolean; reason?: string }> {
  if (!canSendServerEvents()) {
    return { sent: false, reason: "meta capi disabled for this environment" };
  }

  const eventName = toMetaEventName(event);
  if (!eventName) {
    return { sent: false, reason: `no meta equivalent for ${event}` };
  }

  const eventPayload: Record<string, unknown> = {
    event_name: eventName,
    event_id: eventId,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    // Web checkout only — these conversions always originate on the website.
    action_source: "website",
    user_data: buildUserData(userData),
  };

  if (eventSourceUrl) eventPayload.event_source_url = eventSourceUrl;
  const customData = toMetaCustomData(data);
  if (customData) eventPayload.custom_data = customData;

  const body: Record<string, unknown> = { data: [eventPayload] };
  if (META_CAPI_TEST_EVENT_CODE) {
    body.test_event_code = META_CAPI_TEST_EVENT_CODE;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(
        META_CAPI_ACCESS_TOKEN!
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      // Read the Graph API error text: it names the offending field, which is
      // the only way to debug a rejected payload.
      const detail = await response.text();
      console.error("Meta CAPI event rejected", {
        eventName,
        eventId,
        status: response.status,
        detail: detail.slice(0, 500),
      });
      return { sent: false, reason: `http ${response.status}` };
    }

    return { sent: true };
  } catch (error) {
    console.error("Meta CAPI request failed", { eventName, eventId, error });
    return { sent: false, reason: String(error) };
  }
}
