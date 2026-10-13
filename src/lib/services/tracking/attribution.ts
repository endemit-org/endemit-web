import "server-only";

/**
 * Ad-click attribution context captured from the browser request that starts
 * a checkout, and stored on the order.
 *
 * Server-side conversion events fire later, from Inngest, after the payment
 * is confirmed — at that point there is no browser, no cookies and no client
 * IP. Without these values a server event cannot be tied back to the ad click
 * and the platform reports the conversion as unattributed. So the identifiers
 * are snapshotted when the checkout is created and travel with the order.
 */
export interface TrackingAttribution {
  /** Meta browser id (`_fbp` cookie). */
  fbp?: string;
  /** Meta click id (`_fbc` cookie, derived from `fbclid`). */
  fbc?: string;
  /** TikTok click id (`ttclid` query parameter, see middleware). */
  ttclid?: string;
  /** TikTok browser id (`_ttp` cookie, set by the TikTok pixel). */
  ttp?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** URL the checkout was started from. */
  eventSourceUrl?: string;
}

/** Key under `Order.metadata` holding the snapshot. */
export const ATTRIBUTION_METADATA_KEY = "trackingAttribution";

/**
 * Key used before TikTok was added, when the snapshot was Meta-only. Orders
 * created then still carry it, and they can still be reprocessed, so reads
 * fall back to it rather than losing attribution on replay.
 */
const LEGACY_META_METADATA_KEY = "metaAttribution";

export const TTCLID_COOKIE = "_ttclid";

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  const match = header
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

/**
 * The visitor's IP as seen through Vercel's proxy. `x-forwarded-for` may hold
 * a proxy chain; the first entry is the client.
 */
function readClientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : undefined;
}

/**
 * Collects the attribution snapshot from an incoming checkout request, shaped
 * for storage in an order's JSON metadata.
 *
 * Absent values are dropped rather than stored as null, both to keep the blob
 * clean and because Prisma's JSON input type rejects `undefined` members.
 */
export function getTrackingAttribution(
  request: Request
): Record<string, string> {
  const attribution: TrackingAttribution = {
    fbp: readCookie(request, "_fbp"),
    fbc: readCookie(request, "_fbc"),
    // The click id is persisted by our middleware; `_ttp` is the pixel's own.
    ttclid: readCookie(request, TTCLID_COOKIE),
    ttp: readCookie(request, "_ttp"),
    clientIpAddress: readClientIp(request),
    clientUserAgent: request.headers.get("user-agent") ?? undefined,
    eventSourceUrl: request.headers.get("referer") ?? undefined,
  };

  return Object.fromEntries(
    Object.entries(attribution).filter(
      (entry): entry is [string, string] => Boolean(entry[1])
    )
  );
}

/** Reads the snapshot back off an order's `metadata` JSON blob. */
export function readTrackingAttribution(
  metadata: unknown
): TrackingAttribution | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const record = metadata as Record<string, unknown>;
  const value =
    record[ATTRIBUTION_METADATA_KEY] ?? record[LEGACY_META_METADATA_KEY];
  if (!value || typeof value !== "object") return undefined;
  return value as TrackingAttribution;
}
