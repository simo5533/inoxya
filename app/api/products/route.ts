import { NextRequest, NextResponse } from 'next/server'
import { selectAsync, executeQuery, getBetterSqlite3Db, initializeDatabase, serializeError, testConnection, select, detectDriver } from '@/lib/sqlite'
import { getSqlJsDb } from '@/lib/sqljs-singleton'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import { normalizeImageUrl } from '@/lib/image-path'
import type { ProductResponse, DatabaseProduct } from '@/lib/types'
import { createProductSchema, validateWithSchema } from '@/lib/validations'
import { slugToDbValue } from '@/lib/category-mapping'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'
// PHASE 3: Éliminer le cache Next.js sur catalogue
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Récupérer tous les produits (avec filtre optionnel par catégorie)
export async function GET(request: NextRequest) {
  try {
    // Récupérer le paramètre de filtre category depuis l'URL
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    let products: DatabaseProduct[] = []
    
    // PHASE B: FORCER la connexion DB avec singleton
    const betterSqlite3Db = getBetterSqlite3Db()
    let isConnected = !!betterSqlite3Db
    
    // Si better-sqlite3 n'est pas disponible, utiliser sql.js singleton
    if (!isConnected) {
      try {
        await getSqlJsDb()
        isConnected = true
      } catch (e) {
        const errorDetails = serializeError(e)
        logger.error('[GET /api/products] Erreur sql.js:', errorDetails)
        isConnected = false
      }
    }
    
    // Essayer de récupérer depuis la DB si disponible
    if (isConnected) {
      try {
        // Initialiser la base de données si nécessaire
        initializeDatabase()

        // Construire la requête SQL avec filtre optionnel
        // PHASE 4: Gérer les valeurs NULL (is_active = 1 OR is_active IS NULL)
        let sqlQuery = 'SELECT * FROM products WHERE (is_active = 1 OR is_active IS NULL)'
        const params: any[] = []

        if (categorySlug) {
          // Convertir le slug en valeur DB
          const dbValue = slugToDbValue(categorySlug)
          if (dbValue) {
            sqlQuery += ' AND category = ?'
            params.push(dbValue)
            logger.info(`[GET /api/products] Filtrage par catégorie: ${categorySlug} → ${dbValue}`)
          } else {
            logger.warn(`[GET /api/products] Slug de catégorie invalide: ${categorySlug} (aucun produit ne sera retourné)`)
          }
        }

        sqlQuery += ' ORDER BY created_at DESC'

        // PHASE B: Utiliser selectAsync() qui garantit l'initialisation sql.js
        products = await selectAsync(sqlQuery, params) as DatabaseProduct[]
        logger.info(`[GET /api/products] ${products.length} produit(s) récupéré(s) depuis DB${categorySlug ? ` (catégorie: ${categorySlug})` : ''}`)
        
        // Log de diagnostic si aucun produit trouvé
        if (products.length === 0) {
          if (categorySlug) {
            const dbValue = slugToDbValue(categorySlug)
            logger.warn(`[GET /api/products] Aucun produit trouvé pour catégorie "${categorySlug}" (dbValue: "${dbValue}")`)
            // Vérifier si des produits existent dans d'autres catégories
            const allProducts = await selectAsync('SELECT DISTINCT category FROM products WHERE is_active = 1', []) as { category: string }[]
            logger.info(`[GET /api/products] Catégories disponibles en DB: ${allProducts.map((p: any) => p.category).join(', ')}`)
          } else {
            logger.warn(`[GET /api/products] Aucun produit actif trouvé dans la base de données`)
          }
        }
      } catch (dbError) {
        logger.warn('Base de données non accessible:', {
          error: dbError instanceof Error ? dbError.message : String(dbError)
        })
      }
    }
    
    // PHASE C: Vérifier l'accessibilité de la DB AVANT de décider du fallback
    const dbWasAccessible = isConnected
    const isProduction = process.env['NODE_ENV'] === 'production'
    const enableFallback = process.env['ENABLE_FALLBACK'] === '1'
    
    // PHASE C: Stopper les fallbacks silencieux
    // Production: DB KO → 503 (jamais [])
    // Dev: DB KO → 503 (sauf si ENABLE_FALLBACK=1 explicite)
    
    // Si DB était accessible mais retourne vide, c'est normal (DB vide mais valide)
    // Si DB n'était PAS accessible, on doit retourner 503
    if (!dbWasAccessible) {
      logger.error(`[GET /api/products] Base de données inaccessible`)
      return NextResponse.json(
        { 
          error: 'Base de données indisponible',
          message: 'Le service de base de données est temporairement indisponible. Veuillez réessayer plus tard.'
        },
        { 
          status: 503,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      )
    }
    
    // PROTECTION PRODUCTION: Vérification explicite pour garantir qu'aucun fallback ne s'exécute en production
    if (isProduction) {
      logger.info(`[GET /api/products] Production mode: fallback désactivé (${products.length} produit(s) depuis DB)`)
      if (products.length === 0) {
        logger.warn(`[GET /api/products] Production: Base de données vide (mais accessible)`)
        // En production, DB vide mais accessible = retourner [] (pas d'erreur 503)
        // C'est normal si la DB vient d'être créée et n'a pas encore de produits
      }
    }
    
    // Fallback activé UNIQUEMENT si:
    // - ENABLE_FALLBACK=1 (explicite)
    // - ET pas en production (vérification redondante pour sécurité)
    // - ET DB était accessible mais vide (pas si DB inaccessible)
    if ((!products || products.length === 0) && enableFallback && !isProduction && dbWasAccessible) {
      // Utiliser fallback UNIQUEMENT en développement avec flag explicite
      if (!dbWasAccessible || products.length === 0) {
        logger.info(`📦 Base de données ${dbWasAccessible ? 'vide' : 'inaccessible'}, utilisation du fallback depuis les images`)
        const { getAllFallbackProducts } = await import('@/lib/fallback-products')
        const fallbackProducts = getAllFallbackProducts()
        
        // Filtrer par catégorie si demandé
        let filteredProducts = fallbackProducts
        if (categorySlug) {
          filteredProducts = fallbackProducts.filter(p => p.category_id === categorySlug)
        }
        
        // Convertir en format DatabaseProduct
        products = filteredProducts.map((p, index) => ({
          id: index + 1,
          name: p.name,
          name_ar: null,
          description: p.description || null,
          price: p.price,
          original_price: p.original_price || null,
          image_url: p.image_url,
          images: JSON.stringify([]),
          category: categorySlug || 'bagues',
          is_active: p.is_available,
          stock: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) as DatabaseProduct[]
        logger.info(`📦 Fallback: ${products.length} produit(s) récupéré(s) depuis les images`)
      } else {
        // Production avec DB accessible mais vide: retourner [] (pas de fallback)
        logger.info(`[GET /api/products] Base de données vide en production, retour de tableau vide`)
        products = []
      }
    }

    // Transformer les produits pour avoir main_image et images[]
    const productsWithParsedImages = (products || []).map((product: DatabaseProduct): ProductResponse => {
      // Parser les images JSON
      let imagesArray: string[] = []
      if (product.images && typeof product.images === 'string') {
        try {
          imagesArray = JSON.parse(product.images)
        } catch {
          imagesArray = []
        }
      } else if (Array.isArray(product.images)) {
        imagesArray = product.images
      }
      
      // Production: normaliser les chemins (éviter chemins absolus Windows en réponse)
      const mainImage = normalizeImageUrl(product.image_url || null)
      const imagesNormalized = imagesArray.map((img) => normalizeImageUrl(img))
      return {
        id: String(product.id),
        name: product.name,
        price: product.price,
        main_image: mainImage,
        images: imagesNormalized
      }
    })

    logger.db('Récupération produits', true, `${productsWithParsedImages?.length || 0} produits`)
    
    // PHASE 3: Headers pour éviter le cache
    // Retourner directement le tableau pour compatibilité avec les clients existants
    return NextResponse.json(productsWithParsedImages || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    logger.error('Erreur API produits POST', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau produit
export async function POST(request: NextRequest) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }
    
    const auth = await requireAdminApi()
    if ('error' in auth) return auth.error
    const user = auth.user

    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    const validation = validateWithSchema(createProductSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.errors },
        { status: 400 }
      )
    }

    const validatedData = validation.data

    // SÉCURITÉ: Sanitization des entrées utilisateur (après validation Zod)
    const sanitizedName = sanitizeInput(validatedData.name)
    const sanitizedNameAr = validatedData.name_ar ? sanitizeInput(validatedData.name_ar) : null
    const sanitizedDescription = sanitizeInput(validatedData.description)
    const sanitizedCategory = sanitizeInput(validatedData.category)

    logger.db('Création produit', true)

    const isConnected = testConnection()
    if (!isConnected) {
      logger.warn('Connexion SQLite indisponible')
      return NextResponse.json(
        { error: 'Base de données indisponible. Veuillez réessayer plus tard.' },
        { status: 503 }
      )
    }

    // Initialiser la base de données si nécessaire
    initializeDatabase()

    // RÈGLE MÉTIER: Vérifier que la catégorie existe en base
    const catRows = select('SELECT id FROM categories WHERE name = ? OR slug = ?', [sanitizedCategory, sanitizedCategory]) as { id: number }[]
    if (!catRows || catRows.length === 0) {
      return NextResponse.json(
        { error: 'Catégorie inexistante. Veuillez choisir une catégorie valide.' },
        { status: 400 }
      )
    }

    // Utiliser main_image si fourni, sinon image_url (déjà validé par Zod)
    const finalImageUrl = validatedData.main_image || validatedData.image_url || null
    
    // Préparer les images secondaires (convertir array en JSON string si nécessaire)
    const imagesJson = validatedData.images && validatedData.images.length > 0
      ? JSON.stringify(validatedData.images)
      : '[]'

    // SÉCURITÉ: Insérer le produit en base de données avec données sanitizées
    // Utiliser executeQuery qui gère better-sqlite3 et sql.js correctement
    const driver = detectDriver()
    let result: { lastInsertRowid: number | bigint | null; changes: number }
    
    try {
      result = executeQuery(`
        INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sanitizedName,
        sanitizedNameAr,
        sanitizedDescription,
        validatedData.price,
        validatedData.original_price || null,
        sanitizedCategory,
        validatedData.stock || 0,
        validatedData.is_active !== undefined ? Boolean(validatedData.is_active) : true,
        finalImageUrl,
        imagesJson,
        user.id,
        new Date().toISOString(),
        new Date().toISOString()
      ])
    } catch (insertError) {
      logger.error('[POST /api/products] Erreur lors de l\'insertion:', serializeError(insertError))
      return NextResponse.json(
        { 
          error: 'Échec de l\'insertion du produit en base de données',
          details: insertError instanceof Error ? insertError.message : 'Erreur inconnue'
        },
        { status: 500 }
      )
    }

    // Pour sql.js, vérifier manuellement si l'insertion a réussi
    let lastId: number | null = null
    
    if (driver === 'sqljs') {
      // Pour sql.js, récupérer le dernier ID inséré
      const lastIdResult = select('SELECT last_insert_rowid() as id') as Array<{ id: number }>
      if (lastIdResult && lastIdResult.length > 0 && lastIdResult[0]) {
        lastId = lastIdResult[0].id
      }
      
      // Vérifier si le produit a été inséré en cherchant par nom et catégorie
      if (!lastId) {
        const checkProduct = select('SELECT id FROM products WHERE name = ? AND category = ? ORDER BY id DESC LIMIT 1', [sanitizedName, sanitizedCategory]) as Array<{ id: number }>
        if (checkProduct && checkProduct.length > 0 && checkProduct[0]) {
          lastId = checkProduct[0].id
        }
      }
    } else {
      // Pour better-sqlite3, utiliser lastInsertRowid
      lastId = result.lastInsertRowid ? Number(result.lastInsertRowid) : null
    }

    if (result.changes === 0 || !lastId) {
      logger.error('[POST /api/products] Échec insertion:', { changes: result.changes, lastId, driver })
      return NextResponse.json(
        { 
          error: 'Échec de l\'insertion du produit en base de données',
          details: `Aucune ligne insérée (changes: ${result.changes}, lastId: ${lastId})`
        },
        { status: 500 }
      )
    }
    const products = select('SELECT * FROM products WHERE id = ?', [lastId]) as DatabaseProduct[]
    const product = products[0]
    if (!product) {
      return NextResponse.json({ error: 'Erreur lors de la récupération du produit créé' }, { status: 500 })
    }

    // Parser les images JSON
    let imagesArray: string[] = []
    if (product.images && typeof product.images === 'string') {
      try {
        imagesArray = JSON.parse(product.images)
      } catch {
        imagesArray = []
      }
    } else if (Array.isArray(product.images)) {
      imagesArray = product.images
    }

    // Retourner avec main_image et images[] (structure exacte demandée)
    const responseProduct = {
      id: product.id,
      name: product.name,
      price: product.price,
      main_image: product.image_url || null,
      images: imagesArray
    }

    logger.db('Produit créé', true)
    return NextResponse.json(responseProduct, { status: 201 })
  } catch (error) {
    logger.error('Erreur API produits POST', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
