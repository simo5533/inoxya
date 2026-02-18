import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { customRequestSchema, validateWithSchema } from '@/lib/validations'
import { checkRateLimit, requireCSRF } from '@/lib/security'
// import { db } from '@/lib/database-adapter'
// import { getCurrentUser } from '@/lib/auth-supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // SÉCURITÉ: Rate limiting pour prévenir les abus
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const rateCheck = await checkRateLimit(`custom_request_${clientIP}`)
    if (!rateCheck.allowed) {
      logger.warn(`[SECURITY] Custom request rate limit triggered for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Trop de demandes. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(customRequestSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { name, email, phone, type, description, budget } = validation.data

    // Créer la demande sur mesure
    const requestData = {
      name,
      email,
      phone,
      type,
      description,
      budget: budget || 'Non spécifié',
      status: 'pending',
      created_at: new Date().toISOString()
    }

    logger.info('Tentative de création de demande:', requestData)
    
    // Version simplifiée sans db pour test
    const customRequest = {
      id: `custom-${Date.now()}`,
      ...requestData
    }
    
    if (!customRequest) {
      return NextResponse.json({ 
        error: 'Erreur lors de la création de la demande' 
      }, { status: 500 })
    }

    // Optionnel: Envoyer une notification email (à implémenter)
    logger.info('Nouvelle demande sur mesure:', customRequest)

    return NextResponse.json({ 
      success: true, 
      request_id: customRequest.id,
      message: 'Demande sur mesure envoyée avec succès' 
    })

  } catch (error) {
    logger.error('Erreur API demandes sur mesure:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Pour l'instant, on autorise l'accès (à sécuriser plus tard)
    // const user = await getCurrentUser()
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 })
    // }

    // Version simplifiée sans db pour test
    const customRequests = [
      {
        id: 'custom-1',
        name: 'Test User',
        email: 'test@example.com',
        phone: '0612345678',
        type: 'Bague',
        description: 'Test description',
        budget: '1000 MAD',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ]
    return NextResponse.json({ customRequests })

  } catch (error) {
    logger.error('Erreur API demandes sur mesure GET:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
