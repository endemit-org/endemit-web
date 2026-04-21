import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth";
import { PERMISSIONS } from "@/domain/auth/config/permissions.config";
import { prisma } from "@/lib/services/prisma";
import {
  listAllEventClaims,
  type EventClaimListFilter,
} from "@/domain/claim/operations/listAllEventClaims";
import { createEventClaim } from "@/domain/claim/operations/createEventClaim";
import { queueEventClaimProcessing } from "@/domain/claim/operations/queueEventClaimProcessing";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.EVENT_CLAIMS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawFilter = searchParams.get("filter") ?? "all";
    const filter: EventClaimListFilter =
      rawFilter === "PENDING" || rawFilter === "APPROVED" ? rawFilter : "all";
    const search = searchParams.get("search") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "50");

    const result = await listAllEventClaims({ filter, search, page, pageSize });

    return NextResponse.json({
      items: result.items.map(c => ({
        id: c.id,
        eventId: c.eventId,
        eventName: c.eventName,
        status: c.status,
        createdAt: c.createdAt.toISOString(),
        approvedAt: c.approvedAt?.toISOString() ?? null,
        user: c.user,
      })),
      total: result.total,
      pendingCount: result.pendingCount,
      approvedCount: result.approvedCount,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list claims";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!user.permissions.includes(PERMISSIONS.EVENT_CLAIMS_MANAGE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userIdentifier, eventId, eventName } = body ?? {};

    if (typeof userIdentifier !== "string" || !userIdentifier.trim()) {
      return NextResponse.json(
        { error: "userIdentifier (username or email) required" },
        { status: 400 }
      );
    }
    if (typeof eventId !== "string" || !eventId.trim()) {
      return NextResponse.json({ error: "eventId required" }, { status: 400 });
    }
    if (typeof eventName !== "string" || !eventName.trim()) {
      return NextResponse.json(
        { error: "eventName required" },
        { status: 400 }
      );
    }

    const identifier = userIdentifier.trim();
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
          { id: identifier },
        ],
      },
      select: { id: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const claim = await createEventClaim({
      userId: targetUser.id,
      eventId,
      eventName,
    });

    if (targetUser.email) {
      queueEventClaimProcessing({
        claimId: claim.id,
        userId: targetUser.id,
        userEmail: targetUser.email,
        eventId,
        eventName,
      }).catch(() => {});
    }

    return NextResponse.json({
      claim: {
        id: claim.id,
        userId: claim.userId,
        eventId: claim.eventId,
        eventName: claim.eventName,
        status: claim.status,
        createdAt: claim.createdAt.toISOString(),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create claim";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
