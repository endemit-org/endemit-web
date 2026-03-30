import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken } from "@/domain/auth/operations/getSessionByToken";
import { deleteSession } from "@/domain/auth/operations/deleteSession";

const SESSION_COOKIE_NAME = "session_token";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const session = await getSessionByToken(sessionToken);

  if (!session || session.expiresAt < new Date()) {
    // Session invalid or expired - clean up
    if (session) {
      await deleteSession(sessionToken);
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true });
}
