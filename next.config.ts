import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "89.143.77.229",
    "localhost",
    "*.endemit.org",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
      {
        protocol: "https",
        hostname: "*.cdn.prismic.io",
      },
    ],
  },
  async redirects() {
    return [
      // Most specific redirects first
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

      // General redirects with dynamic paths last
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
  },
};

export default nextConfig;
