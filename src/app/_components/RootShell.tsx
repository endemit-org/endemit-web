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
