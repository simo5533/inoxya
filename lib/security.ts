/**
 * Module de sécurité pour INOXYA BIJOUX
 * Gestion sécurisée des mots de passe, sessions et authentification
 */

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { logger } from './logger'

// Configuration de sécurité - Validation paresseuse pour permettre le build
let _jwtSecret: string | null = null
const getJwtSecret = (): string => {
  if (_jwtSecret) return _jwtSecret
  const secret = process.env['JWT_SECRET']
  if (!secret || secret.length < 32) {
    // Build phase: pas d'erreur pour permettre next build
    if (typeof process.env['NEXT_PHASE'] !== 'undefined') {
      return 'build-time-placeholder-secret-32chars!'
    }
    // Production runtime: JWT requis si utilisé (sessions JWT)
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL: JWT_SECRET must be set in environment variables and be at least 32 characters long. Add JWT_SECRET to your production environment.')
    }
    return 'build-time-placeholder-secret-32chars!'
  }
  _jwtSecret = secret
  return secret
}

const JWT_EXPIRES_IN = '7d'
const BCRYPT_ROUNDS = 12

// Rate limiting - Utilise l'adapter (mémoire en dev, Redis en prod)
// Les fonctions sont maintenant dans lib/rate-limit-adapter.ts
// Constantes conservées pour compatibilité
const MAX_LOGIN_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutes
const ATTEMPT_WINDOW = 5 * 60 * 1000 // 5 minutes

// Types pour les tokens JWT
export interface JWTPayload {
  userId: string
  phone: string
  role: 'user' | 'moderator' | 'admin'
  iat?: number
  exp?: number
}

export interface SessionData {
  userId: string
  phone: string
  role: 'user' | 'moderator' | 'admin'
  firstName?: string
  lastName?: string
}

/**
 * Hachage sécurisé des mots de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(BCRYPT_ROUNDS)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  } catch (error) {
    logger.error('Erreur lors du hachage du mot de passe:', error)
    throw new Error('Erreur lors du hachage du mot de passe')
  }
}

/**
 * Vérification sécurisée des mots de passe
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword)
  } catch (error) {
    logger.error('Erreur lors de la vérification du mot de passe:', error)
    return false
  }
}

/**
 * Génération d'un token JWT sécurisé
 */
export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  try {
    return jwt.sign(payload, getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'inoxya-bijoux',
      audience: 'inoxya-users'
    })
  } catch (error) {
    logger.error('Erreur lors de la génération du token JWT:', error)
    throw new Error('Erreur lors de la génération du token')
  }
}

/**
 * Vérification et décodage d'un token JWT
 */
export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), {
      issuer: 'inoxya-bijoux',
      audience: 'inoxya-users'
    }) as JWTPayload
    
    return decoded
  } catch (error) {
    logger.error('Erreur lors de la vérification du token JWT:', error)
    return null
  }
}

/**
 * Création d'une session sécurisée
 */
export async function createSecureSession(sessionData: SessionData): Promise<string> {
  try {
    const token = generateJWT({
      userId: sessionData.userId,
      phone: sessionData.phone,
      role: sessionData.role
    })

    const cookieStore = await cookies()
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    })

    // Cookie supplémentaire pour les données utilisateur (non sensible)
    // SÉCURITÉ: Ne pas stocker le role dans ce cookie côté client
    // Le role doit toujours être vérifié côté serveur via le JWT
    cookieStore.set('user_data', JSON.stringify({
      userId: sessionData.userId,
      firstName: sessionData.firstName,
      lastName: sessionData.lastName
      // NOTE: phone et role retirés pour des raisons de sécurité
    }), {
      httpOnly: false, // Accessible côté client pour l'UI basique
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    })

    return token
  } catch (error) {
    logger.error('Erreur lors de la création de la session:', error)
    throw new Error('Erreur lors de la création de la session')
  }
}

/**
 * Récupération de la session actuelle
 */
export async function getCurrentSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return null
    }

    const payload = verifyJWT(token)
    if (!payload) {
      // Token invalide, nettoyer les cookies
      await clearSession()
      return null
    }

    // Récupérer les données utilisateur depuis le cookie
    const userDataCookie = cookieStore.get('user_data')?.value
    if (userDataCookie) {
      try {
        const userData = JSON.parse(userDataCookie)
        return {
          userId: payload.userId,
          phone: payload.phone,
          role: payload.role,
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      } catch (parseError) {
        logger.error('Erreur lors du parsing des données utilisateur:', parseError)
      }
    }

    return {
      userId: payload.userId,
      phone: payload.phone,
      role: payload.role
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération de la session:', error)
    return null
  }
}

/**
 * Suppression sécurisée de la session
 */
export async function clearSession(): Promise<void> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('auth_token')
    cookieStore.delete('user_data')
  } catch (error) {
    logger.error('Erreur lors de la suppression de la session:', error)
  }
}

/**
 * Validation des mots de passe
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validation des numéros de téléphone marocains
 */
export function validatePhoneNumber(phone: string): boolean {
  // Permettre admin_phone comme identifiant spécial
  if (phone === 'admin_phone') return true
  // Format marocain : +212 ou 0 suivi de 9 chiffres
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/
  return phoneRegex.test(phone)
}

/**
 * Génération d'un token de réinitialisation de mot de passe
 */
export function generatePasswordResetToken(userId: string): string {
  try {
    return jwt.sign(
      { userId, type: 'password_reset' },
      getJwtSecret(),
      { expiresIn: '1h' }
    )
  } catch (error) {
    logger.error('Erreur lors de la génération du token de réinitialisation:', error)
    throw new Error('Erreur lors de la génération du token de réinitialisation')
  }
}

/**
 * Vérification du token de réinitialisation
 */
export function verifyPasswordResetToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    if (decoded.type === 'password_reset') {
      return { userId: decoded.userId }
    }
    return null
  } catch (error) {
    logger.error('Erreur lors de la vérification du token de réinitialisation:', error)
    return null
  }
}

/**
 * Middleware de vérification des rôles
 */
export function requireRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole)
}

/**
 * Logging sécurisé des tentatives de connexion
 */
export function logAuthAttempt(phone: string, success: boolean, ip?: string): void {
  const timestamp = new Date().toISOString()
  const status = success ? 'SUCCESS' : 'FAILED'
  
  // Masquer partiellement le numéro de téléphone dans les logs
  const maskedPhone = phone.length > 4 ? phone.slice(0, 2) + '****' + phone.slice(-2) : '****'
  
  logger.info(`[AUTH] ${timestamp} - ${status} - Phone: ${maskedPhone}${ip ? ` - IP: ${ip}` : ''}`)
}

/**
 * Rate limiting - Vérifier si une IP/phone est bloquée
 * DÉLÉGATION vers lib/rate-limit-adapter.ts (mémoire en dev, Redis en prod)
 */
export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number; remaining?: number }> {
  const { checkRateLimit: checkRateLimitAdapter } = await import('./rate-limit-adapter')
  return checkRateLimitAdapter(identifier, MAX_LOGIN_ATTEMPTS, ATTEMPT_WINDOW, BLOCK_DURATION)
}

/**
 * Rate limiting - Enregistrer une tentative de connexion échouée
 * DÉLÉGATION vers lib/rate-limit-adapter.ts
 */
export async function recordFailedAttempt(identifier: string): Promise<void> {
  const { recordFailedAttempt: recordFailedAttemptAdapter } = await import('./rate-limit-adapter')
  return recordFailedAttemptAdapter(identifier, MAX_LOGIN_ATTEMPTS, ATTEMPT_WINDOW, BLOCK_DURATION)
}

/**
 * Rate limiting - Réinitialiser après connexion réussie
 * DÉLÉGATION vers lib/rate-limit-adapter.ts
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const { resetRateLimit: resetRateLimitAdapter } = await import('./rate-limit-adapter')
  return resetRateLimitAdapter(identifier)
}

/**
 * Sanitize input - Nettoyer les entrées utilisateur
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Prévenir XSS basique
    .slice(0, 1000) // Limiter la longueur
}

/**
 * Normaliser un numéro de téléphone (supprimer espaces, tirets, points)
 * Utilisé pour la recherche dans la DB
 */
export function normalizePhoneNumber(phone: string): string {
  if (typeof phone !== 'string') return ''
  return phone.replace(/[\s\-\.]/g, '').trim()
}

/**
 * Validate and sanitize email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * CSRF Protection - Vérifier l'origine de la requête
 * À utiliser pour les endpoints sensibles (mutations)
 */
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // En développement, accepter localhost
  const isDev = process.env.NODE_ENV === 'development'
  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env['NEXT_PUBLIC_SITE_URL']
  ].filter(Boolean)
  
  if (isDev) {
    // Accepter localhost avec n'importe quel port en développement
    if (origin && origin.startsWith('http://localhost:') || origin?.startsWith('https://localhost:')) {
      return true
    }
    if (referer && (referer.startsWith('http://localhost:') || referer.startsWith('https://localhost:'))) {
      return true
    }
  }
  
  // Vérifier Origin header (prioritaire)
  if (origin) {
    return allowedOrigins.some(allowed => origin.startsWith(allowed as string))
  }
  
  // Fallback sur Referer
  if (referer) {
    return allowedOrigins.some(allowed => referer.startsWith(allowed as string))
  }
  
  // Si aucun header, rejeter en production
  return isDev
}

/**
 * Valider un ID numérique (prévention injection)
 */
export function validateNumericId(id: string | number): boolean {
  const numId = typeof id === 'string' ? parseInt(id, 10) : id
  return !isNaN(numId) && numId > 0 && numId < Number.MAX_SAFE_INTEGER
}

/**
 * Générer un token CSRF sécurisé (pour formulaires)
 */
export function generateCSRFToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Stocker un token CSRF dans un cookie httpOnly
 */
export async function setCSRFToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 heures
    path: '/'
  })
}

/**
 * Récupérer le token CSRF depuis les cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('csrf_token')?.value || null
}

/**
 * Valider un token CSRF
 */
export async function validateCSRFToken(requestToken: string | null): Promise<boolean> {
  if (!requestToken) {
    return false
  }
  
  const storedToken = await getCSRFToken()
  if (!storedToken) {
    return false
  }
  
  // Comparaison sécurisée (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(requestToken),
    Buffer.from(storedToken)
  )
}

/**
 * Middleware CSRF pour routes API sensibles
 * Vérifie le token CSRF dans le header X-CSRF-Token
 */
export async function requireCSRF(request: Request): Promise<{ valid: true } | { valid: false; error: NextResponse }> {
  // Vérifier d'abord l'origine (déjà fait dans validateRequestOrigin)
  if (!validateRequestOrigin(request)) {
    logger.warn('[CSRF] Origine de la requête invalide', { 
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer')
    })
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Origine de la requête invalide' },
        { status: 403 }
      )
    }
  }
  
  // Pour les méthodes de mutation (POST, PUT, DELETE, PATCH)
  const method = request.method
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return { valid: true }
  }
  
  // Récupérer le token depuis le header
  const requestToken = request.headers.get('X-CSRF-Token')
  const storedToken = await getCSRFToken()
  
  logger.info('[CSRF] Validation du token', {
    hasRequestToken: !!requestToken,
    hasStoredToken: !!storedToken,
    requestTokenPrefix: requestToken ? requestToken.substring(0, 8) + '...' : null,
    storedTokenPrefix: storedToken ? storedToken.substring(0, 8) + '...' : null
  })
  
  // Valider le token
  const isValid = await validateCSRFToken(requestToken)
  if (!isValid) {
    logger.warn('[CSRF] Token invalide ou manquant', {
      hasRequestToken: !!requestToken,
      hasStoredToken: !!storedToken
    })
    return {
      valid: false,
      error: NextResponse.json(
        { error: 'Token CSRF invalide ou manquant' },
        { status: 403 }
      )
    }
  }
  
  logger.info('[CSRF] Token valide')
  return { valid: true }
}
