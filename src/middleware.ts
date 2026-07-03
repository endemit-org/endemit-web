import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { STAGING_PASSWORD } from "@/lib/services/env/private";
import { isDevelopment, isProduction } from "@/lib/util/env";
import { routing, LOCALE_COOKIE } from "@/i18n/routing";

const STAGING_LOGIN_PATH = "/staging-login";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Paths that must never be locale-handled: API, the English-only admin/POS/scan
 * areas, staging login, the slice simulator, short links and static assets.
 */
function isLocaleExcluded(pathname: string): boolean {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/scan") ||
    pathname.startsWith("/staging-login") ||
    pathname.startsWith("/slice-simulator") ||
    pathname.startsWith("/s/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts")
  );
}

function handleCORS(request: NextRequest) {
  const origin = request.headers.get("origin") || "";

  const allowedOrigins = [
    "http://127.0.0.1",
    "http://localhost",
    "https://vabisabi-max.tail2eec81.ts.net",
  ];

  const isAllowed =
    allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
    origin.endsWith(".endemit.org") ||
    origin === "https://endemit.org";

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

/** Returns a redirect response when staging auth requires one, otherwise null. */
function handleStagingAuth(request: NextRequest): NextResponse | null {
  const isStaging = !isProduction() && !isDevelopment();

  if (!isStaging) {
    return null;
  }

  const isStagingLoginPage = request.nextUrl.pathname === STAGING_LOGIN_PATH;
  const authCookie = request.cookies.get("staging-auth");
  const isAuthenticated = authCookie?.value === STAGING_PASSWORD;

  if (isAuthenticated && isStagingLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isAuthenticated && !isStagingLoginPage) {
    return NextResponse.redirect(new URL(STAGING_LOGIN_PATH, request.url));
  }

  return null;
}

/**
 * Resolve the locale for an unprefixed request.
 * Precedence: manual switch cookie > Vercel IP geolocation > Slovenian default.
 * The browser Accept-Language header is intentionally ignored.
 */
function resolveLocale(request: NextRequest): "sl" | "en" {
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale === "sl" || cookieLocale === "en") {
    return cookieLocale;
  }

  const country = request.headers.get("x-vercel-ip-country");
  // Geo available and not Slovenia -> English. Geo unavailable -> default (sl).
  if (country && country !== "SI") {
    return "en";
  }

  return "sl";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api")) {
    return handleCORS(request);
  }

  const stagingRedirect = handleStagingAuth(request);
  if (stagingRedirect) {
    return stagingRedirect;
  }

  if (isLocaleExcluded(pathname)) {
    return NextResponse.next();
  }

  const hasEnPrefix = pathname === "/en" || pathname.startsWith("/en/");

  // For unprefixed requests, redirect foreign / cookie-en visitors to /en.
  // An explicit /en URL always wins regardless of cookie/geo.
  if (!hasEnPrefix && resolveLocale(request) === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    return NextResponse.redirect(url);
  }

  // next-intl maps the prefix to a locale (and rewrites / -> /sl internally,
  // 308-redirects a literal /sl/... back to the unprefixed path).
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
