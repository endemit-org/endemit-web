import { NextResponse } from "next/server";

// Short URL printed on physical wristbands/stickers. The path "/s/" is a
// long-lived commitment — printed media in the wild cannot be updated.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const target = new URL("/profile", request.url);
  target.searchParams.set("paymentCode", code);
  return NextResponse.redirect(target, 307);
}
