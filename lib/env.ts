/**
 * Validation des variables d'environnement - INOXYA BIJOUX
 * Production-ready: erreurs explicites, pas d'exposition de secrets côté client.
 * Documente chaque variable utilisée par l'application.
 */

import { logger } from './logger'

// ---------------------------------------------------------------------------
// DOCUMENTATION DES VARIABLES D'ENVIRONNEMENT
// ---------------------------------------------------------------------------
// NODE_ENV          - 'development' | 'production' (Next.js)
// VERCEL            - '1' sur Vercel (déploiement serverless)
// JWT_SECRET        - Requis en production si JWT utilisé (lib/security.ts). Min 32 caractères.
// SMTP_HOST         - Optionnel. Host SMTP pour emails admin.
// SMTP_PORT         - Optionnel. Port SMTP (ex: 587, 465).
// SMTP_USER         - Optionnel. Utilisateur SMTP.
// SMTP_PASS         - Optionnel. Mot de passe SMTP (ne jamais exposer côté client).
// ADMIN_EMAIL       - Optionnel. Email destinataire des notifications (défaut: SMTP_USER).
// NEXT_PUBLIC_SITE_URL - Optionnel. URL du site pour CORS/emails (préfixe NEXT_PUBLIC = exposé au client).
// DATABASE_URL      - Optionnel. Utilisé par lib/postgres.ts si migration Postgres.
// DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD - Optionnel. Postgres (lib/postgres.ts).
// ---------------------------------------------------------------------------

const _envChecked = { jwt: false }

/**
 * Vérifie que JWT_SECRET est défini et valide en production (runtime).
 * À appeler au premier usage des JWT (lib/security.ts l'utilise déjà via getJwtSecret).
 * En build (NEXT_PHASE), on ne lance pas d'erreur pour permettre le build.
 */
export function ensureJwtSecretIfRequired(): void {
  if (_envChecked.jwt) return
  _envChecked.jwt = true
  const isProduction = process.env.NODE_ENV === 'production'
  const isBuild = typeof process.env['NEXT_PHASE'] !== 'undefined'
  if (!isProduction || isBuild) return
  const secret = process.env['JWT_SECRET']
  if (!secret || secret.length < 32) {
    // En production runtime, si quelqu'un utilise les JWT (createSecureSession, etc.)
    // getJwtSecret() dans security.ts lancera déjà une erreur. Ici on log une fois.
    logger.warn(
      '[ENV] JWT_SECRET manquant ou trop court (< 32 caractères). Définir JWT_SECRET en production si vous utilisez les sessions JWT (lib/security.ts).'
    )
  }
}

/**
 * Retourne true si SMTP est configuré (envoi d'emails admin possible).
 * Fallback propre: si non configuré, sendAdminEmail retourne false sans crash.
 */
export function isSmtpConfigured(): boolean {
  const a = process.env['SMTP_HOST']
  const b = process.env['SMTP_PORT']
  const c = process.env['SMTP_USER']
  const d = process.env['SMTP_PASS']
  return !!(a && b && c && d)
}

/**
 * Détecte si l'app tourne sur Vercel (serverless).
 * Sur Vercel, le système de fichiers est éphémère → SQLite non persistant.
 */
export function isVercel(): boolean {
  return process.env['VERCEL'] === '1'
}

/**
 * Environnement d'exécution (development / production).
 */
export function getNodeEnv(): 'development' | 'production' | 'test' {
  const v = process.env.NODE_ENV
  if (v === 'production' || v === 'development' || v === 'test') return v
  return 'development'
}
