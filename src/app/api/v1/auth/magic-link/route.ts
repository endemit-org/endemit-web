import { NextResponse } from "next/server";
import { verifyMagicLink } from "@/domain/auth/operations/verifyMagicLink";
import { createUserSession } from "@/lib/services/auth";

// Only accept callback URLs that stay on this site, to avoid open-redirect.
function safeCallback(raw: string | null): string {
  if (!raw) return "/profile";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/profile";
  return raw;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const callbackUrl = safeCallback(searchParams.get("callbackUrl"));

  if (!token) {
    const errorUrl = new URL("/signin", request.url);
    errorUrl.searchParams.set("error", "invalid_link");
    if (callbackUrl !== "/profile") {
      errorUrl.searchParams.set("callbackUrl", callbackUrl);
    }
    return NextResponse.redirect(errorUrl);
  }

  const result = await verifyMagicLink(token);

  if (result.success && result.userId) {
    await createUserSession(result.userId);
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  const errorUrl = new URL("/signin/verify", request.url);
  if (email) {
    errorUrl.searchParams.set("email", email);
  }
  if (callbackUrl !== "/profile") {
    errorUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  errorUrl.searchParams.set("error", result.error || "Invalid or expired link");

  return NextResponse.redirect(errorUrl);
}
