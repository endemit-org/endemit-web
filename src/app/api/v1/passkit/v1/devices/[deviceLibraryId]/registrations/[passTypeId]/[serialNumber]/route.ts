import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { authorizeTicketPass } from "@/domain/wallet-pass/operations/authorizeTicketPass";
import { readApplePassToken } from "@/domain/wallet-pass/utils/passkitWebService";

// Apple Wallet PassKit web service — device (un)registration.
// https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes

type Params = {
  params: Promise<{
    deviceLibraryId: string;
    passTypeId: string;
    serialNumber: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  const { deviceLibraryId, passTypeId, serialNumber } = await params;
  const token = readApplePassToken(request);

  // Only the current owner's pass may register for updates
  const auth = await authorizeTicketPass(passTypeId, serialNumber, token);
  if (!auth || auth.kind !== "owner" || !token) {
    return new NextResponse(null, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    pushToken?: unknown;
  } | null;
  const pushToken = body?.pushToken;
  if (typeof pushToken !== "string" || !pushToken || pushToken.length > 200) {
    return new NextResponse(null, { status: 400 });
  }

  const key = { deviceLibraryId, passTypeId, serialNumber };
  const existing = await prisma.walletPassRegistration.findUnique({
    where: { deviceLibraryId_passTypeId_serialNumber: key },
    select: { id: true },
  });

  await prisma.walletPassRegistration.upsert({
    where: { deviceLibraryId_passTypeId_serialNumber: key },
    create: { ...key, pushToken, authToken: token },
    update: { pushToken, authToken: token },
  });

  // 201 = newly registered, 200 = already registered
  return new NextResponse(null, { status: existing ? 200 : 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const { deviceLibraryId, passTypeId, serialNumber } = await params;
  const token = readApplePassToken(request);

  // Owners and previous owners (voided pass) may both remove their pass
  const auth = await authorizeTicketPass(passTypeId, serialNumber, token);
  if (!auth) {
    return new NextResponse(null, { status: 401 });
  }

  await prisma.walletPassRegistration.deleteMany({
    where: { deviceLibraryId, passTypeId, serialNumber },
  });

  return new NextResponse(null, { status: 200 });
}
