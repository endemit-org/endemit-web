import { NextResponse } from "next/server";
import { getShortLinkByCode } from "@/domain/shortLink/operations/getShortLinkByCode";
import { recordShortLinkClick } from "@/domain/shortLink/operations/recordShortLinkClick";

/**
 * Admin-managed short links: /go/<code>.
 *
 * Like "/s/", the "/go/" prefix is a long-lived commitment — once a code is
 * on a printed poster or sticker it cannot be changed, so the path itself
 * must stay stable. The *target* is editable in admin for exactly that
 * reason.
 *
 * The redirect is a 307 (temporary) on purpose: browsers and QR scanners
 * cache a 301 indefinitely, which would make re-aiming a printed code
 * useless for anyone who had already scanned it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const link = await getShortLinkByCode(code);

  if (!link) {
    // Unknown and disabled codes are indistinguishable from outside, so a
    // retired code leaks nothing about what it used to point at.
    return new NextResponse("Not found", { status: 404 });
  }

  // Counted before redirecting, but awaited so the write is not cut off when
  // the serverless function is frozen after the response.
  await recordShortLinkClick(link.id);

  return NextResponse.redirect(link.targetUrl, 307);
}
