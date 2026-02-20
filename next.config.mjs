import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin next-intl - utilise i18n/request.ts par défaut
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const baseConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
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

// Fonction pour supprimer tous les flags experimental
// Utile si next-intl ou d'autres plugins tentent d'ajouter des flags experimental
function removeExperimentalFlags(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  // Supprimer l'objet experimental complet
  if (config.experimental) {
    delete config.experimental
  }

  // Supprimer les flags experimental individuels (au cas où)
  const experimentalFlags = [
    'cacheComponents',
    'dynamicIO',
    'ppr',
    'reactCompiler',
    'serverActions',
    'optimizePackageImports',
  ]

  experimentalFlags.forEach(flag => {
    if (config[flag] !== undefined) {
      delete config[flag]
    }
  })

  // Garantir que experimental n'existe plus
  delete config.experimental

  return config
}

// Wrapper pour nettoyer la config après application du plugin next-intl
function createCleanConfig(config) {
  // Si c'est une fonction (cas où next-intl retourne une fonction)
  if (typeof config === 'function') {
    return function nextConfigWrapper(phase, { defaultConfig }) {
      const result = config(phase, { defaultConfig })
      return removeExperimentalFlags(result)
    }
  }

  // Si c'est un objet, le nettoyer directement
  return removeExperimentalFlags(config)
}

// Appliquer le plugin next-intl et nettoyer la config
const configWithNextIntl = withNextIntl(baseConfig)
const finalConfig = createCleanConfig(configWithNextIntl)

export default finalConfig
