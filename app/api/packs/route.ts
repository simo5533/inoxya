import { NextRequest, NextResponse } from 'next/server'
import { 
  createPack
} from '@/lib/pack-management'
import { getAllPacks } from '@/lib/database'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import { getCurrentUser } from '@/lib/auth'
import { getBetterSqlite3Db } from '@/lib/sqlite'
import { getSqlJsDb } from '@/lib/sqljs-singleton'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'
// PHASE D: Éliminer le cache Next.js sur catalogue
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/packs - Récupérer tous les packs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const featured = searchParams.get('featured')
    const search = searchParams.get('search')

    let packs: any[] = []
    
    // PHASE B: FORCER la connexion DB avec singleton
    const betterSqlite3Db = getBetterSqlite3Db()
    let isConnected = !!betterSqlite3Db
    
    // Si better-sqlite3 n'est pas disponible, utiliser sql.js singleton
    if (!isConnected) {
      try {
        await getSqlJsDb()
        isConnected = true
      } catch (e) {
        logger.error('[GET /api/packs] Erreur sql.js:', e instanceof Error ? e.message : String(e))
        isConnected = false
      }
    }
    
    // Essayer de récupérer depuis la DB si disponible
    try {
      if (isConnected) {
        packs = await getAllPacks()
      }
    } catch (dbError) {
      const errorDetails = dbError instanceof Error ? dbError.message : String(dbError)
      logger.error('[GET /api/packs] Erreur DB:', { error: errorDetails })
      isConnected = false
    }
    
    // FALLBACK: UNIQUEMENT si explicitement activé via ENABLE_FALLBACK=1
    // En production, fallback JAMAIS activé (même avec ENABLE_FALLBACK=1)
    const dbWasAccessible = isConnected
    const isProduction = process.env['NODE_ENV'] === 'production'
    const enableFallback = process.env['ENABLE_FALLBACK'] === '1'
    
    // PHASE C: Stopper les fallbacks silencieux
    // Production: DB KO → 503 (jamais [])
    // Dev: DB KO → 503 (sauf si ENABLE_FALLBACK=1 explicite)
    
    // Si DB n'était PAS accessible, on doit retourner 503
    if (!dbWasAccessible) {
      logger.error(`[GET /api/packs] Base de données inaccessible`)
      return NextResponse.json(
        { 
          error: 'Base de données indisponible',
          message: 'Le service de base de données est temporairement indisponible. Veuillez réessayer plus tard.'
        },
        { status: 503 }
      )
    }
    
    // PROTECTION PRODUCTION: Vérification explicite pour garantir qu'aucun fallback ne s'exécute en production
    if (isProduction) {
      logger.info(`[GET /api/packs] Production mode: fallback désactivé (${packs.length} pack(s) depuis DB)`)
      if (packs.length === 0) {
        logger.warn(`[GET /api/packs] Production: Base de données vide (mais accessible)`)
        // En production, DB vide mais accessible = retourner [] (pas d'erreur 503)
        // C'est normal si la DB vient d'être créée et n'a pas encore de packs
      }
    }
    
    // Fallback activé UNIQUEMENT si:
    // - ENABLE_FALLBACK=1 (explicite)
    // - ET pas en production (vérification redondante pour sécurité)
    // - ET DB était accessible mais vide (pas si DB inaccessible)
    if ((!packs || packs.length === 0) && enableFallback && !isProduction && dbWasAccessible) {
      logger.info(`📦 Base de données vide, utilisation du fallback depuis les images`)
      const { getFallbackPacks } = await import('@/lib/fallback-packs')
      const fallbackPacks = getFallbackPacks()
      packs = fallbackPacks.map(pack => ({
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        description: pack.description || '',
        price: pack.price,
        original_price: pack.original_price,
        image_url: pack.image_url || '/placeholder.svg',
        images: [],
        category: pack.category,
        tags: [],
        is_featured: pack.is_featured || false,
        is_active: true,
        stock_quantity: 100,
        min_items: 1,
        max_items: 5,
        discount: {
          type: 'percentage',
          value: 0
        },
        composition: [],
        rating: 4.5,
        reviews_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      logger.info(`📦 Fallback: ${packs.length} pack(s) récupéré(s) depuis les images`)
    } else if (packs.length > 0) {
      logger.info(`📦 API /api/packs: ${packs.length} pack(s) récupéré(s)`)
    } else {
      // Production avec DB accessible mais vide: retourner [] (pas de fallback)
      logger.info(`[GET /api/packs] Base de données vide, retour de tableau vide`)
    }
    
    // Transformer les packs pour correspondre au format attendu
    packs = packs.map(pack => {
      // Extraire original_price depuis la description si présent
      let original_price: number | undefined = undefined
      if (pack.description) {
        const originalPriceMatch = pack.description.match(/Prix original: (\d+)/)
        if (originalPriceMatch) {
          original_price = parseFloat(originalPriceMatch[1])
        }
      }
      
      return {
        id: pack.id,
        name: pack.name,
        slug: pack.slug,
        description: pack.description || '',
        price: pack.price,
        original_price: original_price,
        image_url: pack.image_url || '/placeholder.svg',
        images: [],
        category: 'general',
        tags: [],
        is_featured: pack.is_featured || false,
        is_active: true,
        stock_quantity: 100,
        min_items: 1,
        max_items: 5,
        discount: {
          type: 'percentage',
          value: 0
        },
        composition: [],
        rating: 4.5,
        reviews_count: 0,
        created_at: pack.created_at,
        updated_at: pack.created_at
      }
    })

    // Filtrer par catégorie
    if (category && category !== 'all') {
      packs = packs.filter(pack => pack.category === category)
    }

    // Filtrer les packs vedettes
    if (featured === 'true') {
      packs = packs.filter(pack => pack.is_featured)
    }

    // Recherche
    if (search) {
      const searchTerm = search.toLowerCase()
      packs = packs.filter(pack => 
        pack.name.toLowerCase().includes(searchTerm) ||
        pack.description.toLowerCase().includes(searchTerm) ||
        pack.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm))
      )
    }

    // PHASE D: Headers pour éviter le cache
    return NextResponse.json(packs, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    logger.error('Erreur lors de la récupération des packs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des packs' },
      { status: 500 }
    )
  }
}

// POST /api/packs - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    // SÉCURITÉ: Vérifier les permissions admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent créer des packs.' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    
    // SÉCURITÉ: Validation des données requises
    if (!body.name || !body.slug || !body.price) {
      return NextResponse.json(
        { error: 'Nom, slug et prix sont requis' },
        { status: 400 }
      )
    }

    // SÉCURITÉ: Sanitization des entrées utilisateur
    const sanitizedName = sanitizeInput(body.name)
    const sanitizedSlug = sanitizeInput(body.slug)
    const sanitizedDescription = body.description ? sanitizeInput(body.description) : ''
    const sanitizedCategory = body.category ? sanitizeInput(body.category) : 'general'

    // SÉCURITÉ: Validation des types et valeurs
    const priceNum = parseFloat(body.price)
    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { error: 'Le prix doit être un nombre supérieur à 0' },
        { status: 400 }
      )
    }

    const originalPriceNum = body.original_price ? parseFloat(body.original_price) : undefined
    if (originalPriceNum && (isNaN(originalPriceNum) || originalPriceNum <= 0 || originalPriceNum <= priceNum)) {
      return NextResponse.json(
        { error: 'Le prix original doit être supérieur au prix actuel' },
        { status: 400 }
      )
    }

    // Préparer les données du pack avec données sanitizées
    const packData = {
      name: sanitizedName,
      slug: sanitizedSlug,
      description: sanitizedDescription,
      price: priceNum,
      original_price: originalPriceNum,
      image_url: body.image_url || '',
      images: Array.isArray(body.images) ? body.images : [],
      category: sanitizedCategory,
      tags: Array.isArray(body.tags) ? body.tags : [],
      is_featured: Boolean(body.is_featured),
      is_active: Boolean(body.is_active),
      stock_quantity: parseInt(body.stock_quantity) || 100,
      min_items: parseInt(body.min_items) || 1,
      max_items: parseInt(body.max_items) || 5,
      discount: {
        type: body.discount_type || 'percentage',
        value: parseFloat(body.discount_value) || 0
      },
      composition: Array.isArray(body.composition) ? body.composition : [],
      rating: 4.5,
      reviews_count: 0
    }

    const packId = await createPack(packData)

    return NextResponse.json(
      { id: packId, message: 'Pack créé avec succès' },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Erreur lors de la création du pack:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du pack' },
      { status: 500 }
    )
  }
}
