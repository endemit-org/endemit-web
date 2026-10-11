"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import MetaPixel from "@/app/_components/analytics/MetaPixel";
import TikTokPixel from "@/app/_components/analytics/TikTokPixel";
import { trackPageView } from "@/app/_components/analytics/trackEvent";

/**
 * Single mount point for every advertising pixel.
 *
 * Mounted in the localized layout, so it covers the public site and never the
 * admin, POS or scan areas. Each pixel decides for itself whether it loads,
 * so this renders safely with no platform configured at all.
 */

/**
 * Both pixels report the initial page view from their own init snippet, so
 * the first render must not send a duplicate. Only subsequent client-side
 * navigations are reported here — once, for all platforms.
 */
function RouteChangePageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}

export default function TrackingScripts() {
  return (
    <>
      <MetaPixel />
      <TikTokPixel />
      {/* useSearchParams forces a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <RouteChangePageViews />
      </Suspense>
    </>
  );
}
