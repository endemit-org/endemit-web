import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Version check endpoint for detecting new deployments.
 * Returns the current deployment ID so clients can compare with their bundled version.
 *
 * IMPORTANT: This endpoint must never be cached:
 * - Route config: dynamic = "force-dynamic", revalidate = 0
 * - Response headers: Cache-Control: no-store
 * - Service worker: Added to NEVER_CACHE_PATTERNS
 * - next.config.ts: Additional header rules
 */
export async function GET() {
  // NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID is set by Vercel on each deployment
  // Empty in local development
  const deploymentId = process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || "";

  return NextResponse.json(
    { deploymentId },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
