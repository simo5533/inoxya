import { NextRequest, NextResponse } from 'next/server'
import { 
  createPack
} from '@/lib/pack-management'
import { getAllPacks } from '@/lib/database'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import { getCurrentUser } from '@/lib/auth'

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

    let packs: Array<{
      id: string | number
      name: string
      slug?: string
      description?: string
      price: number
      original_price?: number
      image_url?: string
      is_featured?: boolean
      [key: string]: unknown
    }> = []
    
    // PRIORITÉ: Utiliser getAllPacks() qui utilise automatiquement l'adapter Supabase/Postgres/SQLite
    let dbWasAccessible = false
    try {
      packs = await getAllPacks()
      dbWasAccessible = true
      logger.info(`[GET /api/packs] ${packs.length} pack(s) récupéré(s) via adapter`)
    } catch (dbError) {
      const errorDetails = dbError instanceof Error ? dbError.message : String(dbError)
      logger.error('[GET /api/packs] Erreur DB:', { error: errorDetails })
      dbWasAccessible = false
    }
    
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
    
    // Si aucun pack trouvé mais DB accessible, logger pour diagnostic
    if (packs.length === 0) {
      logger.warn(`[GET /api/packs] Base de données accessible mais aucun pack trouvé`)
      // Retourner un tableau vide plutôt qu'une erreur
      // La page affichera "Aucun pack disponible"
    } else {
      logger.info(`[GET /api/packs] ${packs.length} pack(s) récupéré(s)`)
    }
    
    // Fallback activé UNIQUEMENT si:
    // - ENABLE_FALLBACK=1 (explicite)
    // - ET pas en production (vérification redondante pour sécurité)
    // - ET DB était accessible mais vide (pas si DB inaccessible)
    const isProduction = process.env['NODE_ENV'] === 'production'
    const enableFallback = process.env['ENABLE_FALLBACK'] === '1'
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
    const transformedPacks = packs.map(pack => {
      // Extraire original_price depuis la description si présent
      let original_price: number | undefined = undefined
      const packDescription = pack.description || ''
      if (packDescription) {
        const originalPriceMatch = packDescription.match(/Prix original: (\d+)/)
        if (originalPriceMatch && originalPriceMatch[1]) {
          original_price = parseFloat(originalPriceMatch[1])
        }
      }
      
      const composition = (pack as { composition?: unknown[] })['composition']
      const itemsCount = Array.isArray(composition) && composition.length > 0 ? composition.length : 1
      return {
        id: pack.id,
        name: pack.name,
        slug: pack.slug || pack.name.toLowerCase().replace(/\s+/g, '-'),
        description: packDescription,
        price: pack.price,
        original_price: original_price,
        image_url: pack.image_url || '/placeholder.svg',
        images: [],
        category: 'general',
        tags: [] as string[],
        is_featured: pack.is_featured || false,
        is_active: true,
        stock_quantity: 100,
        min_items: 1,
        max_items: 5,
        discount: {
          type: 'percentage',
          value: 0
        },
        composition: composition || [],
        items_count: itemsCount,
        rating: 4.5,
        reviews_count: 0,
        created_at: (pack as { created_at?: string })['created_at'] || new Date().toISOString(),
        updated_at: (pack as { created_at?: string })['created_at'] || new Date().toISOString()
      }
    })

    // Filtrer par catégorie
    let filteredPacks = transformedPacks
    if (category && category !== 'all') {
      filteredPacks = filteredPacks.filter(pack => (pack as { category?: string })['category'] === category)
    }

    // Filtrer les packs vedettes
    if (featured === 'true') {
      filteredPacks = filteredPacks.filter(pack => pack.is_featured)
    }

    // Recherche
    if (search) {
      const searchTerm = search.toLowerCase()
      filteredPacks = filteredPacks.filter(pack => {
        const packDesc = pack.description || ''
        return pack.name.toLowerCase().includes(searchTerm) ||
          packDesc.toLowerCase().includes(searchTerm) ||
          (pack.tags as string[]).some((tag: string) => tag.toLowerCase().includes(searchTerm))
      })
    }
    
    packs = filteredPacks

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
    
    // SÉCURITÉ: Validation avec Zod
    const { createPackSchema, validateWithSchema } = await import('@/lib/validations')
    const validation = validateWithSchema(createPackSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }
    
    const validatedData = validation.data

    // SÉCURITÉ: Sanitization des entrées utilisateur (après validation Zod)
    const sanitizedName = sanitizeInput(validatedData.name)
    const sanitizedSlug = sanitizeInput(validatedData.slug)
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : ''
    const sanitizedCategory = 'general' // Par défaut pour les packs

    // Préparer les données du pack avec données sanitizées (utiliser validatedData)
    const packData = {
      name: sanitizedName,
      slug: sanitizedSlug,
      description: sanitizedDescription,
      price: validatedData.price,
      image_url: validatedData.image_url,
      images: Array.isArray(validatedData.composition) ? validatedData.composition.map(() => '') : [],
      category: sanitizedCategory,
      tags: [],
      is_featured: validatedData.is_featured || false,
      is_active: true,
      stock_quantity: 100,
      min_items: 1,
      max_items: 5,
      discount: {
        type: 'percentage' as const,
        value: 0
      },
      composition: [],
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
