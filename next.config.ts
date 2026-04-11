import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  redirects: async () => [],
  images: {
    remotePatterns: [],
  },
  typescript: {
    tsconfigPath: './tsconfig.app.json',
  },
}

export default nextConfig
