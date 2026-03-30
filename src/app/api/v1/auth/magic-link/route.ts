import { NextResponse } from "next/server";
import { verifyMagicLink } from "@/domain/auth/operations/verifyMagicLink";
import { createUserSession } from "@/lib/services/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  console.log("Magic link token:", request);

  if (!token) {
    // Redirect to signin with error
    return NextResponse.redirect(
      new URL("/signin?error=invalid_link", request.url)
    );
  }

  const result = await verifyMagicLink(token);

  if (result.success && result.userId) {
    // Create session (this works in Route Handlers)
    await createUserSession(result.userId);

    // Redirect to profile
    return NextResponse.redirect(new URL("/profile", request.url));
  }

  // Verification failed - redirect to verify page with error
  const errorUrl = new URL("/signin/verify", request.url);
  if (email) {
    errorUrl.searchParams.set("email", email);
  }
  errorUrl.searchParams.set("error", result.error || "Invalid or expired link");

  return NextResponse.redirect(errorUrl);
}
