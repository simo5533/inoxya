import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
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

// FORCER la suppression de TOUS les flags experimental
// Même si next-intl ou d'autres plugins essaient de les ajouter
const cleanConfig = (config) => {
  // Supprimer complètement l'objet experimental
  if (config.experimental) {
    delete config.experimental
  }
  
  // Double vérification : supprimer chaque flag individuellement
  const experimentalFlags = [
    'cacheComponents',
    'dynamicIO',
    'ppr',
    'reactCompiler',
    'serverActions',
    'optimizePackageImports',
  ]
  
  if (config.experimental) {
    experimentalFlags.forEach(flag => {
      if (config.experimental[flag] !== undefined) {
        delete config.experimental[flag]
      }
    })
    
    // Si l'objet est vide, le supprimer complètement
    if (Object.keys(config.experimental).length === 0) {
      delete config.experimental
    }
  }
  
  return config
}

// Nettoyer la config avant export
const finalConfig = cleanConfig(nextConfig)

// Garantir qu'aucun experimental n'existe
if (finalConfig.experimental) {
  delete finalConfig.experimental
}

export default finalConfig
