import { createRequire } from 'module'
const require = createRequire(import.meta.url)

let withNextIntl = (config) => config
try {
  const createNextIntlPlugin = require('next-intl/plugin')
  withNextIntl = createNextIntlPlugin('./i18n/request.ts')
} catch {
  console.warn('next-intl/plugin not found — i18n plugin skipped')
}

const isProdHeaders =
  process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
  ...(isProdHeaders
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
  {
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://vercel.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io",
      "media-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
  // FIX Vercel ENOENT/Aborted: externaliser modules natifs et WASM (Sharp, sqlite, sql.js, OpenTelemetry)
  serverExternalPackages: [
    'better-sqlite3',
    'sql.js',
    'sharp',
    '@opentelemetry/api',
  ],
  webpack: (config, { isServer, webpack: webpackApi }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        'better-sqlite3': false,
      }
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpackApi.IgnorePlugin({ resourceRegExp: /^better-sqlite3$/ })
      )
    }
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push('better-sqlite3')
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
