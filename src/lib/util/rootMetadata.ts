import type { Metadata } from "next";
import { isProduction } from "@/lib/util/env";
import { getDefaultOgImage } from "@/lib/util/seo";

/**
 * Base metadata shared by both root layouts. `ogLocale` differs per locale on
 * the localized layout; the unlocalized (admin/POS) layout uses the default.
 */
export function buildRootMetadata(ogLocale = "sl_SI"): Metadata {
  return {
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
      images: [{ url: getDefaultOgImage() }],
      locale: ogLocale,
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
  };
}
