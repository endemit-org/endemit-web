"use client";

import Script from "next/script";
import { PUBLIC_TIKTOK_PIXEL_ID } from "@/lib/services/env/public";
import { isTikTokPixelEnabled } from "@/lib/services/tiktok/enabled";

/**
 * TikTok Pixel loader.
 *
 * Mounted via `TrackingScripts` in the localized layout only, so the admin,
 * POS and scan areas are never tracked. Loading is gated by
 * `isTikTokPixelEnabled()`: production with a configured pixel id, nothing
 * anywhere else — so this stays inert until a TikTok account exists.
 *
 * NOTE ON CONSENT: the pixel loads unconditionally, without a consent prompt,
 * by an explicit product decision. See the note in `MetaPixel`.
 */
export default function TikTokPixel() {
  if (!isTikTokPixelEnabled()) {
    return null;
  }

  return (
    <Script
      id="tiktok-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        // TikTok's official snippet. `ttq.page()` reports the initial view;
        // client-side navigations are reported by TrackingScripts.
        __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(s,a)};
  ttq.load('${PUBLIC_TIKTOK_PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');
        `.trim(),
      }}
    />
  );
}
