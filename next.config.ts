import type { NextConfig } from "next";

const ALLOWED_DEV_ORIGINS = [
  "127.0.0.1",
  "86.61.74.56",
  "localhost",
  "*.endemit.org",
  "vabisabi-max.tail2eec81.ts.net",
];

const IMAGE_CONFIG = {
  remotePatterns: [
    {
      protocol: "https" as const,
      hostname: "images.prismic.io",
    },
    {
      protocol: "https" as const,
      hostname: "*.cdn.prismic.io",
    },
    {
      protocol: "https" as const,
      hostname: "*.public.blob.vercel-storage.com",
    },
  ],
};

const REDIRECTS = [
  {
    source: "/endemit-festival/map",
    destination: "/events/endemit-festival-2025#festival-25-map-timetable",
    permanent: true,
  },
  {
    source: "/endemit-festival/:path*",
    destination: "/events/endemit-festival/:path*",
    permanent: true,
  },
  {
    source: "/ius-primae-noctis/:path*",
    destination: "/events/ius-primae-noctis/:path*",
    permanent: true,
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ALLOWED_DEV_ORIGINS,
  images: IMAGE_CONFIG,
  async redirects() {
    return REDIRECTS;
  },
  outputFileTracingIncludes: {
    // Ticket image generation requires logo and font files
    "/api/**/*": ["./public/images/**/*", "./public/fonts/**/*"],
    "/admin/**/*": ["./public/images/**/*", "./public/fonts/**/*"],
    "/profile/**/*": ["./public/images/**/*", "./public/fonts/**/*"],
  },
  // Prevent bundling heavy Node.js packages - load them at runtime instead
  serverExternalPackages: ["passkit-generator", "node-forge"],
};

export default nextConfig;
