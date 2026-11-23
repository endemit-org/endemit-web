import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

const isValidSecret = (received: string | null, expected: string) => {
  if (!received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/**
 * Prismic webhook: drops the cached CMS content. Requires the shared webhook
 * secret (`?secret=...`, same as the rebuild webhook) — otherwise anyone could
 * flush the whole site's cache on a loop.
 */
export async function POST(request: NextRequest) {
  const expectedSecret = process.env.PRISMIC_WEBHOOK_SECRET;

  if (!expectedSecret) {
    console.error("PRISMIC_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (!isValidSecret(request.nextUrl.searchParams.get("secret"), expectedSecret)) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("prismic");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
