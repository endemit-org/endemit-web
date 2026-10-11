import "server-only";

/**
 * Attribution context captured from the browser request that starts a
 * checkout, and stored on the order.
 *
 * The Conversions API event for a purchase fires later, from Inngest, after
 * Stripe confirms payment — at that point there is no browser, no cookies and
 * no IP. Without these values the server event cannot be tied back to the ad
 * click, and Meta reports the conversion as unattributed. So the identifiers
 * are snapshotted at checkout creation and travel with the order.
 */
export interface MetaAttribution {
  /** Pixel browser id cookie. */
  fbp?: string;
  /** Click id cookie, derived from `fbclid` (see middleware). */
  fbc?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  /** URL the checkout was started from. */
  eventSourceUrl?: string;
}

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
 * Collects the attribution snapshot from an incoming checkout request, ready
 * to be stored in an order's JSON metadata.
 *
 * Absent values are dropped rather than stored as null, both to keep the
 * metadata blob clean and because the return type has to satisfy Prisma's
 * JSON input, which does not accept `undefined` members.
 */
export function getMetaAttribution(request: Request): Record<string, string> {
  const attribution: MetaAttribution = {
    fbp: readCookie(request, "_fbp"),
    fbc: readCookie(request, "_fbc"),
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
export function readMetaAttribution(
  metadata: unknown
): MetaAttribution | undefined {
  if (!metadata || typeof metadata !== "object") return undefined;
  const value = (metadata as Record<string, unknown>).metaAttribution;
  if (!value || typeof value !== "object") return undefined;
  return value as MetaAttribution;
}
