import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  redirects: async () => [],
  images: {
    remotePatterns: [],
  },
}

export default nextConfig
