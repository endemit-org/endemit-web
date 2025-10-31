import type { Metadata } from "next";
import "@/app/_styles/globals.css";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { Providers } from "@/app/providers";
import { Teko, Space_Grotesk } from "next/font/google";
import EnvironmentIndicator from "@/app/_components/development/EnvironmentIndicator";
import { isProduction } from "@/lib/util/env";
import { getDefaultOgImage } from "@/lib/util/seo";

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

export const metadata: Metadata = {
  title: {
    default: "Endemit",
    template: "%s • Endemit",
  },
  description:
    "Endemit is a cultural association and a collective of individuals drawn to sound, code, and image, quietly crafting in their own time. Each project is a reflection of personal obsessions and shared values.",
  keywords: [
    "endemit",
    "techno",
    "rave",
    "ljubljana",
    "libeliče",
    "ljubljana techno",
    "art",
    "music",
    "creative",
  ],
  authors: [{ name: "Endemit" }],
  creator: "Endemit",
  publisher: "Endemit",
  manifest: "/manifest.json",
  metadataBase: new URL("https://endemit.org"),

  openGraph: {
    title: "Endemit",
    description:
      "Endemit is a cultural association and a collective of individuals drawn to sound, code, and image, quietly crafting in their own time.",
    url: "https://endemit.org",
    siteName: "Endemit",
    images: [
      {
        url: getDefaultOgImage(),
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Endemit",
    description:
      "Cultural association and collective drawn to sound, code, and image",
    images: [getDefaultOgImage()],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/images/endemit-logo.png", type: "image/png" },
    ],
    apple: [{ url: "/images/endemit-logo.png" }],
  },

  robots: {
    index: isProduction(),
    follow: isProduction(),
    googleBot: {
      index: isProduction(),
      follow: isProduction(),
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  category: "Arts & Culture",

  alternates: {
    canonical: "https://endemit.org",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headlineFont.variable} ${bodyFont.variable}`}>
      <VercelAnalytics />
      <EnvironmentIndicator />
      <Providers>{children}</Providers>
    </html>
  );
}
