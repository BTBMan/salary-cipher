import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  redirects: async () => [],
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'require-corp',
        },
      ],
    },
  ],
  images: {
    remotePatterns: [],
  },
  typescript: {
    tsconfigPath: './tsconfig.app.json',
  },
  turbopack: {
    resolveAlias: {
      fs: './empty-module.js',
      net: './empty-module.js',
      tls: './empty-module.js',
      child_process: './empty-module.js',
      worker_threads: './empty-module.js',
    },
  },
}

export default nextConfig
