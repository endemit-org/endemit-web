import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAuthMode } from "@/domain/auth/actions/checkAuthMode";

const checkModeSchema = z.object({
  identifier: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = checkModeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid identifier format" },
        { status: 400 }
      );
    }

    const { identifier } = result.data;

    const authModeResult = await checkAuthMode({ identifier });

    return NextResponse.json(authModeResult);
  } catch (error) {
    console.error("Check auth mode error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
