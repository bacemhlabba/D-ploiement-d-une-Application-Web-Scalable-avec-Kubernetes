/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure allowed dev origins to prevent the warning
  experimental: {
    allowedDevOrigins: ["localhost", "192.168.43.236"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
