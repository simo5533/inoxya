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
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.public.blob.vercel-storage.com https://images.unsplash.com https://vercel.com https://*.google.com https://*.googleapis.com https://*.gstatic.com https://www.facebook.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://www.facebook.com https://connect.facebook.net https://*.google-analytics.com https://*.googleapis.com",
      "media-src 'self' blob:",
      "frame-src 'self' https://www.google.com https://maps.google.com https://*.google.com",
      "child-src 'self' https://www.google.com https://maps.google.com https://*.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['next-intl'],
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: '/', destination: '/fr', permanent: true },
      { source: '/login', destination: '/fr/login', permanent: true },
      { source: '/packs', destination: '/fr/packs', permanent: true },
      { source: '/packs/:id', destination: '/fr/packs/:id', permanent: true },
      { source: '/sur-mesure', destination: '/fr/sur-mesure', permanent: true },
      { source: '/a-propos', destination: '/fr/a-propos', permanent: true },
      { source: '/faq', destination: '/fr/faq', permanent: true },
      { source: '/bijoux', destination: '/fr/bijoux', permanent: true },
      { source: '/fr/admin', destination: '/admin', permanent: true },
      { source: '/fr/admin/:path*', destination: '/admin/:path*', permanent: true },
      { source: '/ar/admin', destination: '/admin', permanent: true },
      { source: '/ar/admin/:path*', destination: '/admin/:path*', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
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
    // Sécurité : éviter d’élargir `hostname` sans besoin (URLs optimisées = requêtes serveur).
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
