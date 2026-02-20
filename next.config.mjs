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

// Nettoyage profond et récursif de tous les flags experimental
function deepRemoveExperimental(obj, visited = new WeakSet()) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }

  // Éviter les références circulaires
  if (visited.has(obj)) {
    return obj
  }
  visited.add(obj)

  // Si c'est un tableau, nettoyer chaque élément
  if (Array.isArray(obj)) {
    return obj.map(item => deepRemoveExperimental(item, visited))
  }

  // Créer une copie propre de l'objet
  const cleaned = {}
  
  for (const key in obj) {
    // Ignorer complètement toute clé liée à experimental
    if (
      key === 'experimental' ||
      key === 'cacheComponents' ||
      key === 'dynamicIO' ||
      key === 'ppr' ||
      key === 'reactCompiler' ||
      key === 'serverActions' ||
      key === 'optimizePackageImports'
    ) {
      continue
    }

    // Nettoyer récursivement les valeurs
    const value = obj[key]
    if (value && typeof value === 'object') {
      cleaned[key] = deepRemoveExperimental(value, visited)
    } else {
      cleaned[key] = value
    }
  }

  // Garantir qu'experimental n'existe pas
  delete cleaned.experimental

  return cleaned
}

// Fonction pour supprimer tous les flags experimental (version simple pour objets plats)
function removeExperimentalFlags(config) {
  if (!config || typeof config !== 'object') {
    return config
  }

  // Utiliser le nettoyage profond
  const cleaned = deepRemoveExperimental(config)

  // Garantir une dernière fois qu'experimental n'existe pas
  delete cleaned.experimental
  delete cleaned.cacheComponents
  delete cleaned.dynamicIO

  return cleaned
}

// Wrapper robuste pour intercepter et nettoyer la config
function createCleanConfig(config) {
  // Si c'est une fonction (cas où next-intl retourne une fonction)
  if (typeof config === 'function') {
    return function nextConfigWrapper(phase, { defaultConfig }) {
      // Appeler la fonction originale
      const result = config(phase, { defaultConfig })
      
      // Nettoyer profondément le résultat
      const cleaned = removeExperimentalFlags(result)
      
      // Créer un Proxy pour bloquer toute tentative future d'ajout de flags experimental
      return new Proxy(cleaned, {
        set(target, prop, value) {
          // Bloquer toute tentative d'ajout de flags experimental
          if (
            prop === 'experimental' ||
            prop === 'cacheComponents' ||
            prop === 'dynamicIO' ||
            prop === 'ppr' ||
            prop === 'reactCompiler' ||
            prop === 'serverActions' ||
            prop === 'optimizePackageImports'
          ) {
            // Ignorer silencieusement
            return true
          }
          target[prop] = value
          return true
        },
        get(target, prop) {
          // Si on demande experimental, retourner undefined
          if (prop === 'experimental') {
            return undefined
          }
          const value = target[prop]
          // Si la valeur est un objet, le protéger aussi
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return new Proxy(value, {
              set(innerTarget, innerProp, innerValue) {
                if (innerProp === 'experimental' || innerProp === 'cacheComponents' || innerProp === 'dynamicIO') {
                  return true
                }
                innerTarget[innerProp] = innerValue
                return true
              },
              get(innerTarget, innerProp) {
                if (innerProp === 'experimental') {
                  return undefined
                }
                return innerTarget[innerProp]
              }
            })
          }
          return value
        }
      })
    }
  }

  // Si c'est un objet, le nettoyer et le protéger avec un Proxy
  const cleaned = removeExperimentalFlags(config)
  
  return new Proxy(cleaned, {
    set(target, prop, value) {
      if (
        prop === 'experimental' ||
        prop === 'cacheComponents' ||
        prop === 'dynamicIO' ||
        prop === 'ppr' ||
        prop === 'reactCompiler' ||
        prop === 'serverActions' ||
        prop === 'optimizePackageImports'
      ) {
        return true
      }
      target[prop] = value
      return true
    },
    get(target, prop) {
      if (prop === 'experimental') {
        return undefined
      }
      return target[prop]
    }
  })
}

// Appliquer le plugin next-intl
const configWithNextIntl = withNextIntl(baseConfig)

// Nettoyer et protéger la config finale
const finalConfig = createCleanConfig(configWithNextIntl)

export default finalConfig
