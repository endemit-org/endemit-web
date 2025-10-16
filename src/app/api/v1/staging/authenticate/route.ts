import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === process.env.STAGING_PASSWORD) {
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
