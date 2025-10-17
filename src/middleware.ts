import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const STAGING_LOGIN_PATH = "/staging-login";

function handleCORS(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  const allowedOrigins = ["http://127.0.0.1", "http://localhost"];

  const isAllowed =
    allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
    origin.endsWith(".endemit.org") ||
    origin === "https://endemit.org" ||
    origin === "http://endemit.org";

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": isAllowed ? origin : "",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  return response;
}

function handleStagingAuth(request: NextRequest) {
  const isStaging =
    process.env.CURRENT_ENV !== "production" &&
    process.env.CURRENT_ENV !== "development";

  const isStagingLoginPage = request.nextUrl.pathname === STAGING_LOGIN_PATH;

  if (!isStaging && isStagingLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

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

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api")) {
    return handleCORS(request);
  }

  return handleStagingAuth(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
