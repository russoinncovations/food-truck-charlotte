/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  /** Pretty manifest URLs; host-aware manifest is `/manifest.webmanifest`. */
  async rewrites() {
    return [
      { source: "/manifest-vendor.webmanifest", destination: "/manifest-vendor" },
      { source: "/manifest-admin.webmanifest", destination: "/manifest-admin" },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
