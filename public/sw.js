// Service Worker for Endemit PWA
// Version is passed as query param from registration: sw.js?v={deploymentId}

const DEPLOYMENT_ID = new URL(self.location.href).searchParams.get("v") || "dev";

// Cache names with deployment ID for automatic invalidation
const CACHE_NAMES = {
  appShell: `endemit-app-shell-${DEPLOYMENT_ID}`,
  pages: `endemit-pages-${DEPLOYMENT_ID}`,
  staticAssets: "endemit-static-assets",
  prismicImages: "endemit-prismic-images",
  nextImages: "endemit-next-images",
  googleFonts: "endemit-google-fonts",
};

// Routes that should NEVER be cached (mutations, auth, payments, version checks)
const NEVER_CACHE_PATTERNS = [
  /\/api\/v1\/pos\//,
  /\/api\/v1\/checkout\//,
  /\/api\/v1\/auth\//,
  /\/api\/v1\/admin\//,
  /\/api\/v1\/wallet\//,
  /\/api\/v1\/tickets\/scan/,
  /\/api\/v1\/stickers\//,
  /\/api\/v1\/version/,
];

// Pages to cache with Network-First strategy
const CACHEABLE_PAGES = [
  "/profile",
  "/profile/tickets",
  "/profile/orders",
  "/profile/edit",
];

// Check if URL matches POS route pattern
function isPosRoute(url) {
  return url.pathname.startsWith("/pos");
}

// Check if request should never be cached
function shouldNeverCache(request) {
  const url = new URL(request.url);

  // Never cache non-GET requests
  if (request.method !== "GET") return true;

  // Never cache API mutation routes
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname))) {
    return true;
  }

  return false;
}

// Determine cache strategy based on request
function getCacheStrategy(request) {
  const url = new URL(request.url);

  // Never cache mutations
  if (shouldNeverCache(request)) {
    return "network-only";
  }

  // App shell (JS/CSS bundles)
  if (url.pathname.startsWith("/_next/static/")) {
    return "cache-first";
  }

  // Next.js optimized images
  if (url.pathname.startsWith("/_next/image")) {
    return "stale-while-revalidate";
  }

  // Local static assets
  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/fonts/")) {
    return "cache-first";
  }

  // Prismic CDN images
  if (url.hostname === "images.prismic.io" || url.hostname.endsWith(".cdn.prismic.io")) {
    return "stale-while-revalidate";
  }

  // Google Fonts
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    return "cache-first";
  }

  // Profile and POS pages - network first with cache fallback
  if (CACHEABLE_PAGES.some((page) => url.pathname === page) || isPosRoute(url)) {
    return "network-first";
  }

  // Default: network only (don't cache random pages)
  return "network-only";
}

// Get appropriate cache name for request
function getCacheName(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith("/_next/static/")) {
    return CACHE_NAMES.appShell;
  }

  if (url.pathname.startsWith("/_next/image")) {
    return CACHE_NAMES.nextImages;
  }

  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/fonts/")) {
    return CACHE_NAMES.staticAssets;
  }

  if (url.hostname === "images.prismic.io" || url.hostname.endsWith(".cdn.prismic.io")) {
    return CACHE_NAMES.prismicImages;
  }

  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    return CACHE_NAMES.googleFonts;
  }

  return CACHE_NAMES.pages;
}

// Cache-First strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

// Network-First strategy with cache fallback
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    throw error;
  }
}

// Stale-While-Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

// Install event
self.addEventListener("install", () => {
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => {
            // Keep non-deployment-specific caches (static assets, fonts)
            if (key === CACHE_NAMES.staticAssets) return false;
            if (key === CACHE_NAMES.googleFonts) return false;

            // Delete old deployment-specific caches
            if (key.startsWith("endemit-") && !key.includes(DEPLOYMENT_ID)) {
              return true;
            }

            return false;
          })
          .map((key) => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          })
      );
    })
  );

  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - apply caching strategies
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // Skip non-http(s) requests
  if (!request.url.startsWith("http")) {
    return;
  }

  const strategy = getCacheStrategy(request);

  // Network-only: just fetch, don't cache
  if (strategy === "network-only") {
    return;
  }

  const cacheName = getCacheName(request);

  event.respondWith(
    (async () => {
      switch (strategy) {
        case "cache-first":
          return cacheFirst(request, cacheName);
        case "network-first":
          return networkFirst(request, cacheName);
        case "stale-while-revalidate":
          return staleWhileRevalidate(request, cacheName);
        default:
          return fetch(request);
      }
    })()
  );
});

// Handle messages from clients
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
});
