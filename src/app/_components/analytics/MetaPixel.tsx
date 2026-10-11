"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { PUBLIC_META_PIXEL_ID } from "@/lib/services/env/public";
import { isMetaPixelEnabled } from "@/lib/services/meta/enabled";
import { trackMetaPageView } from "@/app/_components/analytics/metaPixelClient";

/**
 * Meta Pixel loader for the public store and festival pages.
 *
 * Mounted in the localized layout only, so the admin, POS and scan areas are
 * never tracked. Loading is gated by `isMetaPixelEnabled()`: production with
 * a configured pixel id, nothing anywhere else.
 *
 * NOTE ON CONSENT: the pixel loads unconditionally, without a consent
 * prompt, by an explicit product decision. For EU visitors GDPR/ePrivacy
 * normally require prior opt-in before setting pixel cookies. If a consent
 * banner is introduced later, gate this component (and the `fbp`/`fbc`
 * capture in the checkout routes) on the stored consent signal.
 */

/**
 * `fbq('init')` fires its own PageView on load, so the first render must not
 * send a second one. Only subsequent client-side navigations report.
 */
function MetaPixelRouteEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  if (!isMetaPixelEnabled()) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PUBLIC_META_PIXEL_ID}');
fbq('track', 'PageView');
          `.trim(),
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      {/* useSearchParams forces a Suspense boundary in the App Router. */}
      <Suspense fallback={null}>
        <MetaPixelRouteEvents />
      </Suspense>
    </>
  );
}
