import { NextResponse } from "next/server";
import { destroyUserSession } from "@/lib/services/auth";

export async function POST() {
  try {
    await destroyUserSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
