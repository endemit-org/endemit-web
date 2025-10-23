import { cookies } from "next/headers";
import { index } from "@/domain/auth/transformers/transformUserToAuthenticatedUser";
import type { AuthenticatedUser } from "@/domain/auth/types";
import { ROLE_SLUGS } from "@/domain/auth/config/roles.config";
import { deleteSession } from "@/domain/auth/operations/deleteSession";
import { getSessionByToken } from "@/domain/auth/operations/getSessionByToken";
import { createSession } from "@/domain/auth/operations/createSession";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_DAYS = 7;

export async function createUserSession(userId: string, request?: Request) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (request) {
    ipAddress = request.headers.get("x-forwarded-for") ?? undefined;
    userAgent = request.headers.get("user-agent") ?? undefined;
  }

  const session = await createSession({
    userId,
    expiresAt,
    ipAddress,
    userAgent,
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await getSessionByToken(sessionToken);

  if (!session) {
    return null;
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await deleteSession(sessionToken);
    return null;
  }

  return index(session.user);
}

export async function destroyUserSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await deleteSession(sessionToken);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

export async function requireRole(
  roleSlug: (typeof ROLE_SLUGS)[keyof typeof ROLE_SLUGS]
): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!user.roles.includes(roleSlug)) {
    throw new Error(`Role ${roleSlug} required`);
  }

  return user;
}
