import { NextRequest, NextResponse } from "next/server";
import { createUserSession } from "@/lib/services/auth";
import { z } from "zod";
import { verifyOtcCode } from "@/domain/auth/operations/verifyOtcCode";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(4),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const result = verifySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const { email, code } = result.data;

    // Verify OTC code
    const verifyResult = await verifyOtcCode({
      email: email.toLowerCase().trim(),
      code: code.toUpperCase().trim(),
    });

    if (!verifyResult.success || !verifyResult.userId) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || "Invalid code" },
        { status: 401 }
      );
    }

    // Create session
    await createUserSession(verifyResult.userId, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("OTC verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
