import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Pretty manifest URLs (optional); host-based `/manifest.webmanifest` is primary. */
  async rewrites() {
    return [
      { source: "/manifest-vendor.webmanifest", destination: "/manifest-vendor" },
      { source: "/manifest-admin.webmanifest", destination: "/manifest-admin" },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
