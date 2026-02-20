import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix warning: Multiple lockfiles detected
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: [
    'better-sqlite3',
    'sql.js',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }
    return config
  },
}

// Appliquer next-intl
let config = withNextIntl(nextConfig)

// SUPPRIMER AGGRESSIVEMENT tous les flags experimental problématiques
// next-intl peut les ajouter, il faut les supprimer explicitement
if (config.experimental) {
  // Supprimer les flags spécifiques qui causent des erreurs
  delete config.experimental.cacheComponents
  delete config.experimental.dynamicIO
  delete config.experimental.ppr
  delete config.experimental.reactCompiler
  delete config.experimental.serverActions
  
  // Si l'objet experimental est vide, le supprimer complètement
  if (Object.keys(config.experimental).length === 0) {
    delete config.experimental
  }
}

// Double vérification : supprimer experimental complètement si présent
if (config.experimental) {
  delete config.experimental
}

export default config
