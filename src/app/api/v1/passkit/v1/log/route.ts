import { NextResponse } from "next/server";

// Apple Wallet PassKit web service — devices report web-service errors here.
// Logged to Vercel function logs for debugging; nothing is stored.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    logs?: unknown;
  } | null;

  if (Array.isArray(body?.logs)) {
    for (const entry of body.logs.slice(0, 20)) {
      console.warn("[passkit] device log:", String(entry).slice(0, 500));
    }
  }

  return new NextResponse(null, { status: 200 });
}
