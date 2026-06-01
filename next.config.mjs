/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/book-trucks",
        destination: "/book-a-truck",
        permanent: true,
      },
      {
        source: "/book-trucks/success",
        destination: "/book-a-truck/success",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
