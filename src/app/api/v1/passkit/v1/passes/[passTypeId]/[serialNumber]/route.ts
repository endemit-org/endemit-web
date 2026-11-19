import { NextResponse } from "next/server";
import { authorizeTicketPass } from "@/domain/wallet-pass/operations/authorizeTicketPass";
import { buildTicketApplePass } from "@/domain/wallet-pass/operations/buildTicketApplePass";
import { readApplePassToken } from "@/domain/wallet-pass/utils/passkitWebService";

// Apple Wallet PassKit web service — download the latest version of a pass.

type Params = {
  params: Promise<{ passTypeId: string; serialNumber: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { passTypeId, serialNumber } = await params;
  const token = readApplePassToken(request);

  const auth = await authorizeTicketPass(passTypeId, serialNumber, token);
  if (!auth) {
    return new NextResponse(null, { status: 401 });
  }

  // HTTP dates have second precision — compare on whole seconds
  const lastModified = new Date(
    Math.floor(auth.ticket.updatedAt.getTime() / 1000) * 1000
  );
  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    const sinceMs = Date.parse(ifModifiedSince);
    if (Number.isFinite(sinceMs) && lastModified.getTime() <= sinceMs) {
      return new NextResponse(null, { status: 304 });
    }
  }

  try {
    const passBuffer = await buildTicketApplePass(
      auth.ticket,
      auth.kind === "transferredAway"
        ? { transferredAwayToken: auth.token }
        : {}
    );

    return new NextResponse(new Uint8Array(passBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Last-Modified": lastModified.toUTCString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[passkit] Failed to build updated pass:", error);
    return new NextResponse(null, { status: 500 });
  }
}
