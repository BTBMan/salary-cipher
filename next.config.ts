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
  serverExternalPackages: ['pino-pretty', 'lokijs', 'encoding'],
  turbopack: {
    resolveAlias: {
      fs: './module-resolvers/empty-module.js',
      util: './module-resolvers/util-browser.js',
      net: './module-resolvers/empty-module.js',
      tls: './module-resolvers/empty-module.js',
      child_process: './module-resolvers/empty-module.js',
      worker_threads: './module-resolvers/empty-module.js',
    },
  },
}

export default nextConfig
