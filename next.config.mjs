import createNextIntlPlugin from 'next-intl/plugin'

// Plugin next-intl - utilise i18n/request.ts
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  // FIX Vercel ENOENT/Aborted: externaliser modules natifs et WASM (Sharp, sqlite, sql.js, OpenTelemetry)
  serverExternalPackages: [
    'better-sqlite3',
    'sql.js',
    'sharp',
    '@opentelemetry/api',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
      }
    }
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default withNextIntl(nextConfig)
