import "server-only";

import type {
  TrackedEventData,
  TrackedEventName,
} from "@/lib/services/tracking/events";
import type { TrackedUserData } from "@/lib/services/tracking/normalize";
import { sendMetaEvent } from "@/lib/services/meta/capi";
import { sendTikTokEvent } from "@/lib/services/tiktok/eventsApi";

/**
 * Server-side conversion reporting, fanned out to every configured ad
 * platform.
 *
 * Call sites describe the conversion once, in platform-agnostic terms. Each
 * platform decides for itself whether it is configured, what to call the
 * event and how to shape the payload — so adding or removing a platform never
 * touches the business flow that reports the conversion.
 */

export interface ReportConversionParams {
  event: TrackedEventName;
  /**
   * Deduplication key. Must be the exact string the browser sends for the
   * same action; every platform keeps the first of a matching pair.
   */
  eventId: string;
  /** Unix seconds — when the conversion happened, not when this job runs. */
  eventTime?: number;
  eventSourceUrl?: string | null;
  userData: TrackedUserData;
  data?: TrackedEventData;
}

export interface PlatformResult {
  platform: "meta" | "tiktok";
  sent: boolean;
  reason?: string;
}

/**
 * Reports one conversion to all platforms and resolves with a per-platform
 * outcome.
 *
 * Never throws and never short-circuits: the senders already swallow their
 * own failures, and `allSettled` guarantees one platform's outage cannot stop
 * another from being told, nor fail the order processing that called this.
 */
export async function reportConversion({
  event,
  eventId,
  eventTime,
  eventSourceUrl,
  userData,
  data,
}: ReportConversionParams): Promise<PlatformResult[]> {
  const params = { event, eventId, eventTime, eventSourceUrl, userData, data };

  const settled = await Promise.allSettled([
    sendMetaEvent(params),
    sendTikTokEvent(params),
  ]);

  const platforms: PlatformResult["platform"][] = ["meta", "tiktok"];

  return settled.map((result, index) => {
    const platform = platforms[index];
    if (result.status === "fulfilled") {
      return { platform, ...result.value };
    }
    // Defensive: the senders catch internally, so this is unexpected.
    console.error(`${platform} conversion reporting threw`, result.reason);
    return { platform, sent: false, reason: String(result.reason) };
  });
}

/** Compact, log-friendly summary of a fan-out, for an Inngest step result. */
export function summarizeConversionResults(results: PlatformResult[]): string {
  return results
    .map(r => `${r.platform}: ${r.sent ? "sent" : `skipped (${r.reason})`}`)
    .join("; ");
}
