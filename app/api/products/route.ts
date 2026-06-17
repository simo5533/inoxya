import { NextRequest, NextResponse } from 'next/server'
import { selectAsync, executeQuery, getBetterSqlite3Db, initializeDatabase, serializeError, testConnection, select, detectDriver } from '@/lib/sqlite'
import { getSqlJsDb } from '@/lib/sqljs-singleton'
import { requireAdminApi } from '@/lib/admin-auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, requireCSRF } from '@/lib/security'
import type { ProductResponse, DatabaseProduct } from '@/lib/types'
import { createProductSchema, validateWithSchema } from '@/lib/validations'
import { slugToDbValue } from '@/lib/category-mapping'
import { getAllBijoux } from '@/lib/database'
import { getDatabaseAdapter, getAdapterType } from '@/lib/db'
import type { Product } from '@/lib/db/types'
import { STOCK_UNKNOWN } from '@/lib/custom-pack'

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
    const forPack = searchParams.get('for_pack') === '1' || searchParams.get('for_pack') === 'true'

    let products: DatabaseProduct[] = []
    
    // PRIORITÉ 1: Utiliser getAllBijoux qui détecte automatiquement Supabase/Postgres/SQLite
    try {
      const allProducts = await getAllBijoux(categorySlug || undefined)
      if (allProducts && allProducts.length > 0) {
        logger.info(`[GET /api/products] ✅ Récupéré ${allProducts.length} produits via adapter`)
        // Convertir au format DatabaseProduct pour compatibilité
        const dbProducts: DatabaseProduct[] = allProducts.map(p => ({
          id: String(p.id),
          name: p.name,
          name_ar: p.name_ar || null,
          description: p.description || null,
          price: p.price,
          original_price: p.original_price || null,
          image_url: p.image_url || null,
          main_image: p.main_image || p.image_url || null,
          images: p.images ? (Array.isArray(p.images) ? JSON.stringify(p.images) : (typeof p.images === 'string' ? p.images : JSON.stringify([p.images]))) : null,
          category: p.category_id || (p as { category?: string }).category || 'Général',
          stock: typeof (p as { stock?: number }).stock === 'number' ? (p as { stock: number }).stock : 0,
          is_active: p.is_available !== false, // Utiliser is_available comme proxy pour is_active
          is_available: p.is_available !== false,
          is_featured: p.is_featured === true,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: (p as { updated_at?: string }).updated_at || new Date().toISOString(),
        }))
        let listed = dbProducts
        if (forPack) {
          const PACKS_CAT = 'Nos packs'
          listed = dbProducts.filter((p) => {
            const cat = String(p.category || '')
            const price = Number(p.price)
            if (!Number.isFinite(price) || price <= 0) return false
            if (cat === PACKS_CAT) return false
            if (p.is_active === false) return false
            const st = Number(p.stock)
            if (st === 0) return false
            return st === STOCK_UNKNOWN || st > 0
          })
        }
        return NextResponse.json({
          products: listed,
          total: listed.length,
        })
      }
    } catch (adapterError) {
      logger.warn('[GET /api/products] Adapter failed, fallback to SQLite:', serializeError(adapterError))
    }
    
    // FALLBACK: SQLite direct si adapter échoue
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
        const params: Array<string | number> = []

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
            logger.info(`[GET /api/products] Catégories disponibles en DB: ${allProducts.map((p) => p.category).join(', ')}`)
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
    
    // Normaliser le format de réponse : toujours retourner { products: [...], total: ... }
    let normalizedProducts = Array.isArray(products) ? products : []
    if (forPack) {
      const PACKS_CAT = 'Nos packs'
      normalizedProducts = normalizedProducts.filter((p) => {
        const cat = String((p as { category?: string }).category || '')
        const price = Number((p as { price?: number }).price)
        if (!Number.isFinite(price) || price <= 0) return false
        if (cat === PACKS_CAT) return false
        const active = (p as { is_active?: boolean }).is_active !== false
        if (active === false) return false
        const st = Number((p as { stock?: number }).stock)
        if (st === 0) return false
        return st === STOCK_UNKNOWN || st > 0
      })
    }
    return NextResponse.json({
      products: normalizedProducts,
      total: normalizedProducts.length,
    })
    
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
      
      const mainImage = product.image_url || null
      return {
        id: String(product.id),
        name: product.name,
        price: product.price,
        main_image: mainImage,
        images: imagesArray
      }
    })

    logger.db('Récupération produits', true, `${productsWithParsedImages?.length || 0} produits`)
    
    // PHASE 3: Headers pour éviter le cache
    // Retourner directement le tableau pour compatibilité avec les clients existants
    // Normaliser le format de réponse : toujours retourner { products: [...], total: ... }
    const finalProducts = productsWithParsedImages || []
    return NextResponse.json({
      products: finalProducts,
      total: finalProducts.length,
    }, {
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

    // PRIORITÉ 1: Utiliser l'adapter de base de données (Supabase/Postgres/SQLite)
    try {
      const adapter = await getDatabaseAdapter()
      
      // RÈGLE MÉTIER: Vérifier que la catégorie existe
      const categories = await adapter.getCategories()
      const categoryExists = categories.some(cat => 
        cat.name === sanitizedCategory || cat.slug === sanitizedCategory
      )
      
      if (!categoryExists) {
        return NextResponse.json(
          { error: 'Catégorie inexistante. Veuillez choisir une catégorie valide.' },
          { status: 400 }
        )
      }

      // Utiliser main_image si fourni, sinon image_url
      const finalImageUrl = validatedData.main_image || validatedData.image_url || null
      
      // Préparer les images secondaires (convertir array en JSON string si nécessaire)
      const imagesValue = validatedData.images && validatedData.images.length > 0
        ? (Array.isArray(validatedData.images) ? JSON.stringify(validatedData.images) : validatedData.images)
        : '[]'

      // Préparer les données du produit pour l'adapter
      const productData: Partial<Product> & { name: string; price: number; stock: number } = {
        name: sanitizedName,
        name_ar: sanitizedNameAr || undefined,
        description: sanitizedDescription || undefined,
        price: validatedData.price,
        original_price: validatedData.original_price || undefined,
        category: sanitizedCategory,
        category_id: sanitizedCategory,
        stock: validatedData.stock !== undefined ? validatedData.stock : 0,
        is_active: validatedData.is_active !== undefined ? Boolean(validatedData.is_active) : true,
        is_available: validatedData.is_active !== undefined ? Boolean(validatedData.is_active) : true,
        image_url: (finalImageUrl && typeof finalImageUrl === 'string') ? finalImageUrl : undefined,
        main_image: (finalImageUrl && typeof finalImageUrl === 'string') ? finalImageUrl : undefined,
        images: typeof imagesValue === 'string' ? imagesValue : (Array.isArray(imagesValue) ? JSON.stringify(imagesValue) : '[]'),
        is_featured: Boolean((validatedData as { is_featured?: boolean }).is_featured || false),
      }

      // Créer le produit via l'adapter
      let createdProduct: Product | null = null
      try {
        createdProduct = await adapter.createProduct(productData)
      } catch (createErr) {
        const createMsg = createErr instanceof Error ? createErr.message : String(createErr)
        logger.error('[POST /api/products] createProduct adapter:', { error: createMsg })
        throw createErr
      }

      if (!createdProduct) {
        throw new Error('Adapter createProduct a retourné null')
      }

      logger.info(`[POST /api/products] ✅ Produit créé via adapter: ${createdProduct.id}`)

      // Réponse: utiliser l'URL d'image soumise si l'adapter a normalisé (placeholder) pour affichage correct
      const rawImage = createdProduct.image_url ?? createdProduct.main_image ?? finalImageUrl
      const responseImageUrl: string | null = typeof rawImage === 'string' && rawImage ? rawImage : null

      // Si create_pack (création depuis Collections), créer aussi un pack pour affichage dans /packs
      const createPack = (body as { create_pack?: boolean }).create_pack === true
      if (createPack && typeof adapter.createPack === 'function') {
        const slugBase = sanitizedName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'collection'
        const slug = `${slugBase}-${createdProduct.id}`
        const packCreated = await adapter.createPack({
          name: sanitizedName,
          slug,
          description: sanitizedDescription || '',
          price: validatedData.price,
          image_url: (finalImageUrl && typeof finalImageUrl === 'string') ? finalImageUrl : undefined,
          is_featured: Boolean((validatedData as { is_featured?: boolean }).is_featured || false),
        })
        if (packCreated) {
          logger.info(`[POST /api/products] ✅ Pack créé pour la collection: ${packCreated.id}`)
        } else {
          logger.warn('[POST /api/products] Création pack (collection) échouée ou non supportée')
        }
      }
      
      // Convertir au format DatabaseProduct pour la réponse
      const responseProduct: DatabaseProduct = {
        id: String(createdProduct.id),
        name: createdProduct.name,
        name_ar: createdProduct.name_ar || null,
        description: createdProduct.description || null,
        price: createdProduct.price,
        original_price: createdProduct.original_price || null,
        category: createdProduct.category || createdProduct.category_id || 'Général',
        stock: (createdProduct as { stock?: number }).stock || 0,
        is_active: createdProduct.is_active !== false,
        image_url: responseImageUrl,
        images: typeof createdProduct.images === 'string' 
          ? createdProduct.images 
          : (Array.isArray(createdProduct.images) ? JSON.stringify(createdProduct.images) : null),
        created_by: user.id,
        created_at: createdProduct.created_at || new Date().toISOString(),
        updated_at: createdProduct.updated_at || new Date().toISOString(),
      }

      return NextResponse.json(responseProduct, { status: 201 })
    } catch (adapterError) {
      // Log détaillé de l'erreur adapter
      const errorMessage = adapterError instanceof Error ? adapterError.message : String(adapterError)
      const errorStack = adapterError instanceof Error ? adapterError.stack : undefined
      logger.error('[POST /api/products] ❌ Erreur adapter:', { 
        error: errorMessage,
        stack: errorStack,
        adapterType: getAdapterType() ?? 'unknown',
      })
      
      // Fallback vers SQLite si l'adapter échoue
      logger.warn('[POST /api/products] Tentative fallback SQLite...')
      
      const isConnected = testConnection()
      if (!isConnected) {
        logger.error('[POST /api/products] ❌ Connexion SQLite indisponible - Aucun fallback disponible')
        return NextResponse.json(
          { 
            error: 'Échec de la création du produit en base de données',
            details: errorMessage,
          },
          { status: 500 }
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
    }
  } catch (error) {
    logger.error('Erreur API produits POST', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
