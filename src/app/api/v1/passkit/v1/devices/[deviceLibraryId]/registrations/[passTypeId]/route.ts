import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";

// Apple Wallet PassKit web service — "which of my passes changed?"
// Called by the device after a push. No auth header on this endpoint (per
// Apple's spec); it only reveals serial numbers already on that device.

type Params = {
  params: Promise<{ deviceLibraryId: string; passTypeId: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { deviceLibraryId, passTypeId } = await params;

  const registrations = await prisma.walletPassRegistration.findMany({
    where: { deviceLibraryId, passTypeId },
    select: { serialNumber: true },
  });
  if (registrations.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  // passesUpdatedSince is the lastUpdated tag we returned last time (epoch ms)
  const sinceParam = new URL(request.url).searchParams.get("passesUpdatedSince");
  const sinceMs = sinceParam ? Number(sinceParam) : NaN;
  const since = Number.isFinite(sinceMs) ? new Date(sinceMs) : null;

  const tickets = await prisma.ticket.findMany({
    where: {
      id: { in: registrations.map(r => r.serialNumber) },
      ...(since && { updatedAt: { gt: since } }),
    },
    select: { id: true, updatedAt: true },
  });
  if (tickets.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const lastUpdated = Math.max(...tickets.map(t => t.updatedAt.getTime()));

  return NextResponse.json({
    serialNumbers: tickets.map(t => t.id),
    lastUpdated: String(lastUpdated),
  });
}
