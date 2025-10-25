import { NextResponse } from "next/server";
import { STAGING_PASSWORD } from "@/lib/services/env/private";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === STAGING_PASSWORD) {
    const response = NextResponse.json({ success: true });

    response.cookies.set("staging-auth", password, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
