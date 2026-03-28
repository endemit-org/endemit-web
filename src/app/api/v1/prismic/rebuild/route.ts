import { NextRequest, NextResponse } from "next/server";

interface PrismicWebhookPayload {
  type: string;
  secret?: string;
  masterRef?: string;
  releases?: {
    addition?: unknown[];
    update?: unknown[];
    deletion?: unknown[];
  };
  documents?: unknown[];
}

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.PRISMIC_WEBHOOK_SECRET;
  const vercelDeployHook = process.env.VERCEL_DEPLOY_HOOK_URL;

  if (!expectedSecret) {
    console.error("PRISMIC_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (!vercelDeployHook) {
    console.error("VERCEL_DEPLOY_HOOK_URL is not configured");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Invalid secret" },
      { status: 401 }
    );
  }

  let payload: PrismicWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  // Check if this is a release publish event
  // When a release is published in Prismic, it appears as releases.deletion
  // because the release gets merged into master and "deleted"
  const isReleasePublished =
    payload.type === "api-update" &&
    payload.releases?.deletion &&
    payload.releases.deletion.length > 0;

  if (!isReleasePublished) {
    return NextResponse.json({
      triggered: false,
      reason: "Not a release publish event",
      type: payload.type,
      hasReleasesDeletion: Boolean(payload.releases?.deletion?.length),
    });
  }

  // Trigger Vercel rebuild
  try {
    const response = await fetch(vercelDeployHook, {
      method: "POST",
    });

    if (!response.ok) {
      console.error("Failed to trigger Vercel deploy:", await response.text());
      return NextResponse.json(
        { error: "Failed to trigger rebuild" },
        { status: 502 }
      );
    }

    console.log("Vercel rebuild triggered successfully from Prismic release");

    return NextResponse.json({
      triggered: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Error triggering Vercel deploy:", error);
    return NextResponse.json(
      { error: "Failed to trigger rebuild" },
      { status: 502 }
    );
  }
}
