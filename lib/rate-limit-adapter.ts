/**
 * Rate Limiting Adapter
 * Dev: In-memory Map (perdu au redémarrage)
 * Prod: Upstash Redis (persistant, partagé entre instances)
 * 
 * NOTE: @upstash/redis est optionnel. Si non installé, utilise la mémoire.
 */

import { logger } from './logger'
import { serializeError } from './sqlite'

interface RateLimitRecord {
  count: number
  lastAttempt: number
  blockedUntil?: number
}

interface RateLimitResult {
  allowed: boolean
  retryAfter?: number
  remaining?: number
}

// In-memory store (dev fallback)
const memoryStore = new Map<string, RateLimitRecord>()

// Upstash Redis client (lazy import)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedisClient = any
let redisClient: RedisClient | null = null
let redisAvailable = false

/**
 * Initialise le client Upstash Redis si configuré
 */
async function initRedis(): Promise<boolean> {
  if (redisClient !== null) {
    return redisAvailable
  }

  const upstashRedisRestUrl = process.env['UPSTASH_REDIS_REST_URL']
  const upstashRedisRestToken = process.env['UPSTASH_REDIS_REST_TOKEN']

  if (!upstashRedisRestUrl || !upstashRedisRestToken) {
    redisAvailable = false
    return false
  }

  try {
    // Lazy require de @upstash/redis (optionnel, seulement si installé)
    // Utiliser require() avec une vérification dynamique pour éviter l'erreur TypeScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Redis: any
    try {
      // Utiliser eval pour éviter que Next.js ne résolve le module à la compilation
      // eslint-disable-next-line no-eval
      const requireFunc = eval('require')
       
      const redisModule = requireFunc('@upstash/redis')
      Redis = redisModule.Redis || redisModule.default?.Redis || redisModule.default
      if (!Redis) {
        throw new Error('Redis class not found in @upstash/redis module')
      }
    } catch {
      logger.warn('[RATE LIMIT] ⚠️ @upstash/redis non installé, utilisation de la mémoire')
      redisAvailable = false
      return false
    }
    
    redisClient = new Redis({
      url: upstashRedisRestUrl,
      token: upstashRedisRestToken,
    })
    
    // Test de connexion
    await redisClient.ping()
    redisAvailable = true
    logger.info('[RATE LIMIT] ✅ Upstash Redis connecté')
    return true
  } catch (error) {
    logger.warn('[RATE LIMIT] ⚠️ Upstash Redis non disponible, utilisation de la mémoire:', serializeError(error))
    redisAvailable = false
    return false
  }
}

/**
 * Rate limit avec Redis (production)
 */
async function checkRateLimitRedis(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000, // 5 minutes
  blockDurationMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<RateLimitResult> {
  if (!redisClient) {
    const initialized = await initRedis()
    if (!initialized) {
      // Fallback vers mémoire
      return checkRateLimitMemory(identifier, maxAttempts, windowMs, blockDurationMs)
    }
  }

  try {
    const now = Date.now()
    const key = `rate_limit:${identifier}`
    
    // Récupérer le record
    const recordStr = await redisClient.get(key)
    let record: RateLimitRecord | null = null
    
    if (recordStr) {
      try {
        record = JSON.parse(recordStr as string) as RateLimitRecord
      } catch {
        record = null
      }
    }

    // Si bloqué, vérifier expiration
    if (record?.blockedUntil) {
      if (now < record.blockedUntil) {
        return {
          allowed: false,
          retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
        }
      }
      // Blocage expiré, supprimer
      await redisClient.del(key)
      record = null
    }

    // Si fenêtre expirée, réinitialiser
    if (record && now - record.lastAttempt > windowMs) {
      await redisClient.del(key)
      record = null
    }

    if (!record) {
      return { allowed: true, remaining: maxAttempts }
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - record.count),
    }
  } catch (error) {
    logger.warn('[RATE LIMIT] Erreur Redis, fallback mémoire:', serializeError(error))
    return checkRateLimitMemory(identifier, maxAttempts, windowMs, blockDurationMs)
  }
}

/**
 * Enregistrer une tentative échouée avec Redis
 */
async function recordFailedAttemptRedis(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): Promise<void> {
  if (!redisClient) {
    const initialized = await initRedis()
    if (!initialized) {
      recordFailedAttemptMemory(identifier, maxAttempts, windowMs, blockDurationMs)
      return
    }
  }

  try {
    const now = Date.now()
    const key = `rate_limit:${identifier}`
    
    const recordStr = await redisClient.get(key)
    let record: RateLimitRecord = { count: 0, lastAttempt: now }
    
    if (recordStr) {
      try {
        record = JSON.parse(recordStr as string) as RateLimitRecord
      } catch {
        record = { count: 0, lastAttempt: now }
      }
    }

    record.count++
    record.lastAttempt = now

    if (record.count >= maxAttempts) {
      record.blockedUntil = now + blockDurationMs
      logger.warn(`[SECURITY] Rate limit triggered for identifier: ${identifier.slice(0, 4)}****`)
    }

    // Sauvegarder avec TTL (expire après blockDuration + window)
    const ttl = Math.max(blockDurationMs, windowMs) / 1000
    await redisClient.setex(key, ttl, JSON.stringify(record))
  } catch (error) {
    logger.warn('[RATE LIMIT] Erreur Redis, fallback mémoire:', serializeError(error))
    recordFailedAttemptMemory(identifier, maxAttempts, windowMs, blockDurationMs)
  }
}

/**
 * Réinitialiser rate limit avec Redis
 */
async function resetRateLimitRedis(identifier: string): Promise<void> {
  if (!redisClient) {
    return
  }

  try {
    const key = `rate_limit:${identifier}`
    await redisClient.del(key)
  } catch (error) {
    logger.warn('[RATE LIMIT] Erreur Redis reset:', serializeError(error))
  }
}

/**
 * Rate limit avec mémoire (développement)
 */
function checkRateLimitMemory(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  _blockDurationMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const record = memoryStore.get(identifier)

  if (!record) {
    return { allowed: true, remaining: maxAttempts }
  }

  // Si bloqué, vérifier expiration
  if (record.blockedUntil) {
    if (now < record.blockedUntil) {
      return {
        allowed: false,
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000),
      }
    }
    // Blocage expiré
    memoryStore.delete(identifier)
    return { allowed: true, remaining: maxAttempts }
  }

  // Si fenêtre expirée, réinitialiser
  if (now - record.lastAttempt > windowMs) {
    memoryStore.delete(identifier)
    return { allowed: true, remaining: maxAttempts }
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - record.count),
  }
}

/**
 * Enregistrer tentative échouée avec mémoire
 */
function recordFailedAttemptMemory(
  identifier: string,
  maxAttempts: number = 5,
  _windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): void {
  const now = Date.now()
  const record = memoryStore.get(identifier) || { count: 0, lastAttempt: now }

  record.count++
  record.lastAttempt = now

  if (record.count >= maxAttempts) {
    record.blockedUntil = now + blockDurationMs
    logger.warn(`[SECURITY] Rate limit triggered for identifier: ${identifier.slice(0, 4)}****`)
  }

  memoryStore.set(identifier, record)
}

/**
 * Réinitialiser rate limit mémoire
 */
function resetRateLimitMemory(identifier: string): void {
  memoryStore.delete(identifier)
}

// ==================== API PUBLIQUE ====================

/**
 * Vérifier rate limit (adapter automatique)
 */
export async function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): Promise<RateLimitResult> {
  const isProduction = process.env['NODE_ENV'] === 'production'
  const hasRedisConfig = !!(process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN'])

  if (isProduction && hasRedisConfig) {
    return checkRateLimitRedis(identifier, maxAttempts, windowMs, blockDurationMs)
  }

  // Dev ou Redis non configuré: utiliser mémoire
  return checkRateLimitMemory(identifier, maxAttempts, windowMs, blockDurationMs)
}

/**
 * Enregistrer tentative échouée (adapter automatique)
 */
export async function recordFailedAttempt(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 5 * 60 * 1000,
  blockDurationMs: number = 15 * 60 * 1000
): Promise<void> {
  const isProduction = process.env['NODE_ENV'] === 'production'
  const hasRedisConfig = !!(process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN'])

  if (isProduction && hasRedisConfig) {
    return recordFailedAttemptRedis(identifier, maxAttempts, windowMs, blockDurationMs)
  }

  recordFailedAttemptMemory(identifier, maxAttempts, windowMs, blockDurationMs)
}

/**
 * Réinitialiser rate limit (adapter automatique)
 */
export async function resetRateLimit(
  identifier: string
): Promise<void> {
  const isProduction = process.env['NODE_ENV'] === 'production'
  const hasRedisConfig = !!(process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN'])

  if (isProduction && hasRedisConfig) {
    return resetRateLimitRedis(identifier)
  }

  resetRateLimitMemory(identifier)
}

