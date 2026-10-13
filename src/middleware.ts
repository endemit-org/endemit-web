import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { STAGING_PASSWORD } from "@/lib/services/env/private";
import { isDevelopment, isProduction } from "@/lib/util/env";
import { routing, LOCALE_COOKIE } from "@/i18n/routing";
import { isMetaPixelEnabled } from "@/lib/services/meta/enabled";
import { isTikTokPixelEnabled } from "@/lib/services/tiktok/enabled";
import { TTCLID_COOKIE } from "@/lib/services/tracking/attribution";

const STAGING_LOGIN_PATH = "/staging-login";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Paths that must never be locale-handled: API, the English-only admin/POS/scan
 * areas, staging login, the slice simulator, short links ("/s/" wristbands and
 * "/go/" admin-managed codes) and static assets.
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
    pathname.startsWith("/go/") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/models")
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

// Search/social crawlers must never be geo-redirected: Googlebot crawls
// mostly from US IPs, so redirecting non-SI visitors to /en would hide every
// unprefixed (Slovenian, default-locale) page from indexing. Bots get the
// content of the URL they asked for and discover /en via hreflang alternates.
const BOT_UA =
  /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|applebot|petalbot/i;

function isBot(request: NextRequest): boolean {
  return BOT_UA.test(request.headers.get("user-agent") ?? "");
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

/** 90 days, matching the platforms' own click-attribution windows. */
const CLICK_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/**
 * Persists ad clicks as first-party cookies.
 *
 * Both Meta and TikTok attribute a conversion to a campaign through a click
 * id in the landing URL (`fbclid`, `ttclid`). The purchase itself is reported
 * later, from the server, with no browser present — so the click id has to be
 * durable from the moment of landing. Writing it here, rather than leaving it
 * to the pixel scripts, also survives a pixel being blocked or loading late.
 *
 * Meta's `_fbc` has a prescribed `fb.1.<millis>.<fbclid>` format. TikTok's
 * click id is stored raw under our own cookie name, since TikTok's pixel owns
 * `_ttp` and expects `ttclid` to be passed through verbatim.
 *
 * Neither is httpOnly: the pixels read them too.
 */
function captureClickIds(request: NextRequest, response: NextResponse): void {
  const options = {
    maxAge: CLICK_ID_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax" as const,
    secure: true,
  };

  // An existing cookie is the earlier, more valuable click: never overwrite.
  if (isMetaPixelEnabled()) {
    const fbclid = request.nextUrl.searchParams.get("fbclid");
    if (fbclid && !request.cookies.get("_fbc")) {
      response.cookies.set("_fbc", `fb.1.${Date.now()}.${fbclid}`, options);
    }
  }

  if (isTikTokPixelEnabled()) {
    const ttclid = request.nextUrl.searchParams.get("ttclid");
    if (ttclid && !request.cookies.get(TTCLID_COOKIE)) {
      response.cookies.set(TTCLID_COOKIE, ttclid, options);
    }
  }
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
  // An explicit /en URL always wins regardless of cookie/geo. Crawlers are
  // never geo-redirected (see BOT_UA) so both language trees stay indexable.
  if (!hasEnPrefix && !isBot(request) && resolveLocale(request) === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/en" : `/en${pathname}`;
    const redirect = NextResponse.redirect(url);
    captureClickIds(request, redirect);
    return redirect;
  }

  // next-intl maps the prefix to a locale (and rewrites / -> /sl internally,
  // 308-redirects a literal /sl/... back to the unprefixed path).
  const response = intlMiddleware(request);
  captureClickIds(request, response);
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|images|fonts|models).*)",
  ],
};
