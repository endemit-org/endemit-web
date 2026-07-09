import { NextResponse } from "next/server";
import { prisma } from "@/lib/services/prisma";
import { verifyReceiveCode } from "@/domain/wallet/util/receiveCode";
import { generateWalletApplePass } from "@/domain/wallet-pass/operations/generateWalletApplePass";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ receiveCode: string }> }
) {
  try {
    const { receiveCode } = await params;

    if (!receiveCode) {
      return NextResponse.json(
        { error: "Receive code is required" },
        { status: 400 }
      );
    }

    // The route is public: possession of a validly signed receive code is
    // the credential. Reject anything that doesn't verify, without
    // distinguishing malformed input from a bad signature.
    const code = decodeURIComponent(receiveCode);
    const userId = verifyReceiveCode(code);
    if (!userId) {
      return NextResponse.json({ error: "Invalid code" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invalidStatuses = ["SUSPENDED", "BANNED", "DELETED"];
    if (invalidStatuses.includes(user.status)) {
      return NextResponse.json(
        { error: "This wallet is no longer valid" },
        { status: 403 }
      );
    }

    const passBuffer = await generateWalletApplePass({
      userId: user.id,
      userName: user.name ?? user.username,
      receiveCode: code,
    });

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(passBuffer);
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": 'attachment; filename="endemit-wallet.pkpass"',
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating Apple Wallet pass:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("certificate") ||
        error.message.includes("APPLE_")
      ) {
        return NextResponse.json(
          { error: "Apple Wallet pass configuration error" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate Apple Wallet pass" },
      { status: 500 }
    );
  }
}
