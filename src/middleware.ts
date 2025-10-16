import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAGING_LOGIN_PATH = "/staging-login";

export function middleware(request: NextRequest) {
  const isStaging =
    process.env.CURRENT_ENV !== "production" &&
    process.env.CURRENT_ENV !== "development";

  const isStagingLoginPage = request.nextUrl.pathname === STAGING_LOGIN_PATH;

  // If not on staging but trying to access staging-login, redirect to home
  if (!isStaging && isStagingLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If on staging, check auth (but skip check if already on login page)
  if (isStaging && !isStagingLoginPage) {
    const authCookie = request.cookies.get("staging-auth");

    if (
      !authCookie?.value ||
      authCookie.value !== process.env.STAGING_PASSWORD
    ) {
      return NextResponse.redirect(new URL(STAGING_LOGIN_PATH, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next/static|_next/image|favicon.ico|images).*)",
};
