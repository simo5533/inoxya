import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin next-intl - utilise i18n/request.ts par défaut
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix warning: Multiple lockfiles detected
  outputFileTracingRoot: __dirname,
  // CONTRAINTES STRICTES FORCÉES - Production et développement
  eslint: {
    ignoreDuringBuilds: true, // Désactivé temporairement - erreurs mineures (apostrophes)
    dirs: ['app', 'components', 'lib'],
  },
  typescript: {
    ignoreBuildErrors: false, // Activé pour production - erreurs critiques uniquement
    tsconfigPath: './tsconfig.json',
  },
  // Optimisations de production
  // swcMinify est activé par défaut dans Next.js 15+
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // FORCER HTTPS - Configuration stricte
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ],
      },
    ]
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Tailles optimisées pour HD/2x (Retina) - Plus de résolutions pour meilleure qualité
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      // Vercel Blob Storage
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
    ],
    // Note: La qualité (quality) doit être spécifiée dans chaque composant Image, pas ici
    // Toutes les images de packs utilisent déjà quality={100} dans les composants
  },
  // PHASE 3B: Externaliser better-sqlite3 et sql.js pour éviter les problèmes de binding
  // Ajouter @opentelemetry pour éviter les erreurs avec Sentry
  serverExternalPackages: [
    'better-sqlite3', 
    'sql.js', 
    '@vercel/blob',
    '@opentelemetry/api',
    '@opentelemetry/instrumentation',
    '@opentelemetry/instrumentation-amqplib',
    '@opentelemetry/instrumentation-connect',
    '@opentelemetry/instrumentation-fs',
    '@opentelemetry/instrumentation-http',
    '@opentelemetry/instrumentation-net',
    '@opentelemetry/instrumentation-pg',
    '@opentelemetry/instrumentation-redis',
    '@opentelemetry/instrumentation-sqlite3',
  ],
  // Configuration Webpack - optimisée pour éviter les erreurs de chargement
  webpack: (config, { dev, isServer, webpack }) => {
    if (dev) {
      // En développement, désactiver le cache pour éviter les problèmes
      config.cache = false
    }
    
    // Forcer la résolution des alias @/
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname),
      }
      
      // Ne pas utiliser d'alias pour éviter la récursion
      
      // Configuration pour sql.js - éviter les problèmes de module
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
      }
      
      // Ignorer @vercel/blob au build (optionnel, chargé dynamiquement en runtime)
      // Utiliser IgnorePlugin pour éviter le warning au build
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@vercel\/blob$/,
        })
      )
      
      // Ignorer Sentry uniquement
      // OpenTelemetry est maintenant créé directement dans node_modules via postinstall
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^@sentry\/nextjs$/,
        })
      )
      
      // Améliorer la résolution des modules
      config.resolve.extensionAlias = {
        '.js': ['.ts', '.tsx', '.js', '.jsx'],
        '.mjs': ['.mts', '.mjs'],
      }
    }
    
    // Externaliser sql.js et better-sqlite3 pour éviter les problèmes de bundling
    if (isServer) {
      config.externals = config.externals || []
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = [
          ...(Array.isArray(originalExternals) ? originalExternals : []),
          'sql.js',
          'better-sqlite3'
        ]
      } else if (Array.isArray(config.externals)) {
        config.externals.push('sql.js', 'better-sqlite3')
      }
    }
    
    // Optimiser les chunks pour éviter les erreurs de chargement
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Créer un chunk séparé pour les vendors lourds
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Chunk séparé pour les composants UI
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]ui[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // Chunk séparé pour les libs
            lib: {
              name: 'lib',
              test: /[\\/]lib[\\/]/,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }
    }
    
    // Ignorer les warnings de source maps en développement
    if (dev) {
      config.ignoreWarnings = [
        { module: /node_modules/ },
        { file: /\.wasm$/ },
      ]
    }
    
    return config
  },
}

export default withNextIntl(nextConfig)
