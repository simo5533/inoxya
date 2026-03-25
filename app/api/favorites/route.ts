import { NextRequest, NextResponse } from 'next/server'
import { addToFavorites, removeFromFavorites, getFavorites } from '@/lib/database'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { favoriteActionSchema, validateWithSchema } from '@/lib/validations'
import { requireCSRF } from '@/lib/security'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // Vérifier l'authentification
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(favoriteActionSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    const { bijou_id, pack_id, action } = validation.data

    let result
    if (action === 'add') {
      if (bijou_id) {
        result = await addToFavorites(user.id, String(bijou_id))
      } else if (pack_id) {
        result = await addToFavorites(user.id, String(pack_id))
      }
    } else {
      if (bijou_id) {
        result = await removeFromFavorites(user.id, String(bijou_id))
      } else if (pack_id) {
        result = await removeFromFavorites(user.id, String(pack_id))
      }
    }

    if (result) {
      return NextResponse.json({
        success: true,
        isFavorite: action === 'add',
        message: action === 'add' ? 'Ajouté aux favoris' : 'Retiré des favoris',
      })
    } else {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

  } catch (error) {
    logger.error('Erreur API favoris:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const bijouIdParam =
      request.nextUrl.searchParams.get('bijou_id') ??
      request.nextUrl.searchParams.get('bijouId')

    const user = await getCurrentUser()

    if (bijouIdParam) {
      if (!user) {
        return NextResponse.json({ isFavorite: false })
      }
      const favorites = await getFavorites(user.id)
      const isFavorite = favorites.some(
        (f) => String(f.bijou_id) === String(bijouIdParam)
      )
      return NextResponse.json({ isFavorite })
    }

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const favorites = await getFavorites(user.id)
    return NextResponse.json({ favorites })
  } catch (error) {
    logger.error('Erreur API favoris GET:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
