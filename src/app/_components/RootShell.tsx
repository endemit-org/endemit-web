import "@/app/_styles/globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";
import { Teko, Space_Grotesk } from "next/font/google";
import EnvironmentIndicator from "@/app/_components/development/EnvironmentIndicator";
import OfflineToast from "@/app/_components/ui/OfflineToast";
import VersionChecker from "@/app/_components/VersionChecker";
import ServiceWorkerRegistration from "@/app/_components/ServiceWorkerRegistration";

const headlineFont = Teko({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  weight: ["400", "600"],
});

const bodyFont = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  weight: ["300", "400", "600", "700"],
});

/**
 * Shared <html>/<body> shell used by both root layouts (localized and
 * unlocalized). Keeps fonts, analytics, service worker and background styling
 * identical across the public site and the admin/POS area.
 */
export default function RootShell({
  lang,
  children,
}: Readonly<{
  lang: string;
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={lang}
      className={`${headlineFont.variable} ${bodyFont.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://player.vimeo.com" />
        <link rel="preconnect" href="https://f.vimeocdn.com" crossOrigin="" />
        <link rel="preconnect" href="https://i.vimeocdn.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://player.vimeo.com" />
        {process.env.NODE_ENV !== "production" && (
          // Runs from the always-fresh HTML before any (possibly stale) bundle:
          // a dev service worker serving cached chunks causes hydration
          // mismatches, so unregister it + clear caches and reload once.
          <script
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){if(!rs.length)return;Promise.all(rs.map(function(r){return r.unregister()})).then(function(){return window.caches?caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k)}))}):null}).then(function(){if(!sessionStorage.getItem('sw-dev-killed')){sessionStorage.setItem('sw-dev-killed','1');location.reload()}})})}`,
            }}
          />
        )}
      </head>
      <body
        className="m-auto overflow-y-scroll"
        style={{
          backgroundImage: "url('/images/endemit-pattern.svg')",
          backgroundSize: "110px",
          backgroundColor: "#000",
        }}
      >
        <VercelAnalytics />
        <VercelSpeedInsights />
        <EnvironmentIndicator />
        <ServiceWorkerRegistration />
        <OfflineToast />
        <VersionChecker />
        {children}
      </body>
    </html>
  );
}
