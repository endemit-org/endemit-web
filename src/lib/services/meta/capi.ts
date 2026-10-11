import "server-only";

import {
  META_CAPI_ACCESS_TOKEN,
  META_CAPI_TEST_EVENT_CODE,
  META_PIXEL_ID,
} from "@/lib/services/env/private";
import { isProduction } from "@/lib/util/env";
import type { MetaCustomData, MetaEventName } from "@/lib/services/meta/events";
import {
  hashCity,
  hashCountry,
  hashEmail,
  hashExternalId,
  hashName,
  hashPhone,
  hashPostalCode,
  splitName,
} from "@/lib/services/meta/hash";

const GRAPH_API_VERSION = "v21.0";

/**
 * Server-side Meta Conversions API sender, used only by the web store
 * checkout flow. POS orders, gate scans and wallet movements are deliberately
 * out of scope: they are on-site operations, not ad-attributable web
 * conversions, and feeding them in would inflate campaign results.
 *
 * Every event sent from here must also be sent from the browser pixel with
 * the same `event_name` and `event_id`, so Meta deduplicates the pair instead
 * of counting the conversion twice.
 */

/** Raw (unhashed) identifiers. Hashing happens here, never at the call site. */
export interface MetaUserData {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  externalId?: string | null;
  /** `_fbp` cookie captured in the browser at checkout time. */
  fbp?: string | null;
  /** `_fbc` cookie (click id) captured in the browser at checkout time. */
  fbc?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
}

export interface SendMetaEventParams {
  eventName: MetaEventName;
  /** Must match the browser event's `eventID` exactly. */
  eventId: string;
  /** Unix seconds. Defaults to now. Meta rejects events older than 7 days. */
  eventTime?: number;
  eventSourceUrl?: string | null;
  userData: MetaUserData;
  customData?: MetaCustomData;
}

/**
 * Whether server-side events may be sent.
 *
 * Production with both secrets present is the normal case. A non-production
 * environment sends only when `META_CAPI_TEST_EVENT_CODE` is deliberately
 * set, because Meta flags those as test traffic and excludes them from ads
 * reporting and optimization — that is the only safe way for someone to
 * verify the wiring in Events Manager from staging. With no Meta variables
 * configured, every environment stays silent.
 */
function canSendServerEvents(): boolean {
  if (!META_CAPI_ACCESS_TOKEN || !META_PIXEL_ID) return false;
  return isProduction() || Boolean(META_CAPI_TEST_EVENT_CODE);
}

function buildUserData(userData: MetaUserData): Record<string, unknown> {
  const { firstName, lastName } = splitName(userData.name);

  // Meta expects each hashed identifier as an array of hashes.
  const hashed: Record<string, string | undefined> = {
    em: hashEmail(userData.email),
    ph: hashPhone(userData.phone),
    fn: hashName(firstName),
    ln: hashName(lastName),
    ct: hashCity(userData.city),
    zp: hashPostalCode(userData.postalCode),
    country: hashCountry(userData.country),
    external_id: hashExternalId(userData.externalId),
  };

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(hashed)) {
    if (value) payload[key] = [value];
  }

  // fbp/fbc/IP/user agent are sent unhashed — Meta requires them raw.
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

function buildCustomData(
  customData?: MetaCustomData
): Record<string, unknown> | undefined {
  if (!customData) return undefined;
  const entries = Object.entries(customData).filter(
    ([, value]) => value !== undefined && value !== null
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

/**
 * Sends one event to the Conversions API.
 *
 * Never throws: analytics must not be able to fail a paid order's processing.
 * Failures are logged and reported in the return value so the caller (an
 * Inngest step) can record them without retrying the whole payment flow.
 */
export async function sendMetaEvent({
  eventName,
  eventId,
  eventTime,
  eventSourceUrl,
  userData,
  customData,
}: SendMetaEventParams): Promise<{ sent: boolean; reason?: string }> {
  if (!canSendServerEvents()) {
    return { sent: false, reason: "meta capi disabled for this environment" };
  }

  const event: Record<string, unknown> = {
    event_name: eventName,
    event_id: eventId,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    // Web checkout only — these conversions always originate on the website.
    action_source: "website",
    user_data: buildUserData(userData),
  };

  if (eventSourceUrl) event.event_source_url = eventSourceUrl;
  const custom = buildCustomData(customData);
  if (custom) event.custom_data = custom;

  const body: Record<string, unknown> = { data: [event] };
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
