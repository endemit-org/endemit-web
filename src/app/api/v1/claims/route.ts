import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { createEventClaim } from "@/domain/claim/operations/createEventClaim";
import { getEventClaimsByUserId } from "@/domain/claim/operations/getEventClaimsByUserId";
import { queueEventClaimProcessing } from "@/domain/claim/operations/queueEventClaimProcessing";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { eventId, eventName } = body;

    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: "Missing eventId or eventName" },
        { status: 400 }
      );
    }

    const claim = await createEventClaim({
      userId: user.id,
      eventId,
      eventName,
    });

    // Queue the claim for delayed processing
    await queueEventClaimProcessing({
      claimId: claim.id,
      userId: user.id,
      userEmail: user.email,
      eventId,
      eventName,
    });

    return NextResponse.json({
      success: true,
      claim: {
        id: claim.id,
        eventId: claim.eventId,
        eventName: claim.eventName,
        status: claim.status,
        createdAt: claim.createdAt,
      },
    });
  } catch (error) {
    console.error("Create event claim error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create claim";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await getEventClaimsByUserId(user.id);

    return NextResponse.json({
      claims: claims.map((c: {
        id: string;
        eventId: string;
        eventName: string;
        status: string;
        createdAt: Date;
        approvedAt: Date | null;
      }) => ({
        id: c.id,
        eventId: c.eventId,
        eventName: c.eventName,
        status: c.status,
        createdAt: c.createdAt,
        approvedAt: c.approvedAt,
      })),
    });
  } catch (error) {
    console.error("Get event claims error:", error);
    return NextResponse.json(
      { error: "Failed to get claims" },
      { status: 500 }
    );
  }
}
