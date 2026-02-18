/**
 * Validateur centralisé des variables d'environnement avec Zod
 * Fail-fast en production si variables critiques manquantes
 */

import { z } from 'zod'
// Temporairement désactivé pour éviter les blocages - utiliser console directement
// import { logger } from './logger'

// ==================== SCHÉMA ZOD ====================

const envSchema = z.object({
  // NODE_ENV
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // VERCEL
  VERCEL: z.string().optional(),
  
  // NEXT_PUBLIC_SITE_URL (obligatoire en production)
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  
  // JWT_SECRET (obligatoire en production, min 32 chars)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET doit contenir au moins 32 caractères').optional(),
  
  // DATABASE_URL (obligatoire sur Vercel, optionnel ailleurs)
  DATABASE_URL: z.string().url().optional(),
  
  // SMTP (optionnel, mais si un champ est défini, tous doivent l'être)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  
  // BLOB_STORE (pour Vercel Blob, optionnel)
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  
  // UPSTASH_REDIS (pour rate limiting en production, optionnel)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

// Type inféré depuis le schéma
type EnvSchema = z.infer<typeof envSchema>

interface EnvValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  env?: EnvSchema
}

/**
 * Valide toutes les variables d'environnement avec Zod
 */
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Récupérer toutes les variables d'environnement
  const rawEnv: Record<string, string | undefined> = {
    NODE_ENV: process.env['NODE_ENV'],
    VERCEL: process.env['VERCEL'],
    NEXT_PUBLIC_SITE_URL: process.env['NEXT_PUBLIC_SITE_URL'],
    JWT_SECRET: process.env['JWT_SECRET'],
    DATABASE_URL: process.env['DATABASE_URL'],
    SMTP_HOST: process.env['SMTP_HOST'],
    SMTP_PORT: process.env['SMTP_PORT'],
    SMTP_USER: process.env['SMTP_USER'],
    SMTP_PASS: process.env['SMTP_PASS'],
    ADMIN_EMAIL: process.env['ADMIN_EMAIL'],
    BLOB_READ_WRITE_TOKEN: process.env['BLOB_READ_WRITE_TOKEN'],
    UPSTASH_REDIS_REST_URL: process.env['UPSTASH_REDIS_REST_URL'],
    UPSTASH_REDIS_REST_TOKEN: process.env['UPSTASH_REDIS_REST_TOKEN'],
  }
  
  const isProduction = rawEnv['NODE_ENV'] === 'production'
  const isVercel = rawEnv['VERCEL'] === '1'
  
  // Validation Zod (permissive pour les champs optionnels)
  const parseResult = envSchema.safeParse(rawEnv)
  
  if (!parseResult.success) {
    // Erreurs de format Zod
    parseResult.error.errors.forEach((err) => {
      const path = err.path.join('.')
      errors.push(`${path}: ${err.message}`)
    })
  }
  
  // Validations métier supplémentaires
  const env = parseResult.success ? parseResult.data : null
  
  if (env) {
    // NEXT_PUBLIC_SITE_URL obligatoire en production
    if (isProduction && !env.NEXT_PUBLIC_SITE_URL) {
      errors.push('NEXT_PUBLIC_SITE_URL est obligatoire en production')
    } else if (!env.NEXT_PUBLIC_SITE_URL) {
      warnings.push('NEXT_PUBLIC_SITE_URL non défini, utilisation de la valeur par défaut')
    }
    
    // JWT_SECRET obligatoire en production
    if (isProduction && !env.JWT_SECRET) {
      errors.push('JWT_SECRET est obligatoire en production et doit contenir au moins 32 caractères')
    } else if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET devrait contenir au moins 32 caractères pour la sécurité')
    }
    
    // DATABASE_URL obligatoire sur Vercel
    if (isVercel && !env.DATABASE_URL) {
      errors.push('DATABASE_URL est obligatoire sur Vercel (SQLite non supporté)')
    } else if (isProduction && !env.DATABASE_URL) {
      warnings.push('DATABASE_URL non défini, utilisation de SQLite (non recommandé en production)')
    }
    
    // Validation format DATABASE_URL si présent
    if (env.DATABASE_URL) {
      try {
        const url = new URL(env.DATABASE_URL)
        if (!['postgresql:', 'postgres:'].includes(url.protocol)) {
          warnings.push(`DATABASE_URL utilise le protocole "${url.protocol}" (attendu: postgresql://)`)
        }
      } catch {
        errors.push('DATABASE_URL doit être une URL valide')
      }
    }
    
    // SMTP: si un champ est défini, tous doivent l'être
    const smtpFields = [env.SMTP_HOST, env.SMTP_PORT, env.SMTP_USER, env.SMTP_PASS]
    const smtpDefined = smtpFields.filter(Boolean).length
    
    if (smtpDefined > 0 && smtpDefined < 4) {
      warnings.push('Configuration SMTP incomplète (tous les champs SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS doivent être définis)')
    }
    
    // BLOB_READ_WRITE_TOKEN recommandé en production sur Vercel
    if (isVercel && !env.BLOB_READ_WRITE_TOKEN) {
      warnings.push('BLOB_READ_WRITE_TOKEN recommandé sur Vercel pour les uploads de fichiers')
    }
    
    // UPSTASH_REDIS: si un champ est défini, les deux doivent l'être
    const redisFields = [env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN]
    const redisDefined = redisFields.filter(Boolean).length
    
    if (redisDefined > 0 && redisDefined < 2) {
      warnings.push('Configuration Upstash Redis incomplète (UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN doivent être définis ensemble)')
    }
  }
  
  // ==================== LOGGING ====================
  // Utiliser console au lieu de logger pour éviter les blocages potentiels
  // Le logger pourrait essayer d'écrire dans un fichier et bloquer
  
  if (errors.length > 0) {
    console.error('[ENV VALIDATOR] Erreurs de configuration:', errors)
  }
  
  if (warnings.length > 0) {
    console.warn('[ENV VALIDATOR] Avertissements de configuration:', warnings)
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('[ENV VALIDATOR] ✅ Configuration environnement valide')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    env: env || undefined,
  }
}

/**
 * Valide l'environnement et lance une erreur si critique
 * Fail-fast en production
 * À appeler au démarrage de l'application
 */
export function ensureValidEnvironment(): void {
  // Ne pas valider pendant le build Next.js
  const isBuild = typeof process.env['NEXT_PHASE'] !== 'undefined'
  if (isBuild) {
    return
  }
  
  const result = validateEnvironment()
  
  if (!result.valid) {
    const errorMessage = `Configuration environnement invalide:\n${result.errors.join('\n')}`
    
    const isProduction = process.env['NODE_ENV'] === 'production'
    
    if (isProduction) {
      // En production runtime: fail-fast
      throw new Error(errorMessage)
    } else {
      // En développement: console seulement (éviter logger qui pourrait bloquer)
      console.error('[ENV VALIDATOR]', errorMessage)
      console.warn('[ENV VALIDATOR] Continuer en mode développement malgré les erreurs...')
    }
  }
}

/**
 * Récupère une variable d'environnement validée
 * Utilise le résultat de validateEnvironment() si disponible
 */
export function getValidatedEnv(): EnvSchema | null {
  const result = validateEnvironment()
  return result.env || null
}
