import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, checkRateLimit, recordFailedAttempt, requireCSRF } from '@/lib/security'
import { registerSchema, validateWithSchema } from '@/lib/validations'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // Rate limiting par IP
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    
    const rateCheck = await checkRateLimit(`register_${clientIP}`)
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Trop de tentatives. Réessayez dans ${rateCheck.retryAfter} secondes.` },
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // SÉCURITÉ: Ne JAMAIS accepter le rôle depuis le client
    // Les nouveaux utilisateurs sont TOUJOURS créés avec le rôle 'user'
    // Seul un admin peut modifier le rôle via l'interface admin

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(registerSchema, body)
    if (!validation.success) {
      await recordFailedAttempt(`register_${clientIP}`)
      // Améliorer le message d'erreur pour le mot de passe
      const errorMessages = validation.errors.map(err => {
        if (err.includes('mot de passe')) {
          return 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial (!@#$%^&*(),.?":{}|<>)'
        }
        return err
      })
      return NextResponse.json(
        { success: false, error: errorMessages.join('. ') },
        { status: 400 }
      )
    }

    const { phone, password, firstName, lastName } = validation.data

    // Sanitize inputs (après validation Zod)
    // NOTE: phone est déjà normalisé par phoneSchema.transform()
    const sanitizedFirstName = firstName ? sanitizeInput(firstName) : ''
    const sanitizedLastName = lastName ? sanitizeInput(lastName) : ''
    // Le phone est déjà normalisé par Zod (espaces/tirets supprimés)
    const sanitizedPhone = phone.trim()

    // Appeler la fonction d'inscription - TOUJOURS avec role='user'
    const result = await registerUser(sanitizedPhone, password, sanitizedFirstName, sanitizedLastName, 'user')
    const statusCode = result.success ? 201 : 400

    if (!result.success) {
      await recordFailedAttempt(`register_${clientIP}`)
    }

    logger.api('POST', '/api/auth/register', statusCode)
    return NextResponse.json(result, { status: statusCode })
  } catch (error) {
    logger.error('Erreur lors de l\'inscription', { context: 'API_AUTH_REGISTER', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

