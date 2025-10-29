import type { NextConfig } from "next";

const ALLOWED_DEV_ORIGINS = [
  "127.0.0.1",
  "89.143.77.229",
  "localhost",
  "*.endemit.org",
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
  ],
};

const REDIRECTS = [
  {
    source: "/endemit-festival/map",
    destination: "/events/endemit-festival/map-and-timetable",
    permanent: true,
  },
  {
    source: "/festival",
    destination: "/events/endemit-festival",
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
};

export default nextConfig;
