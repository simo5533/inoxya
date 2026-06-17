import { NextRequest, NextResponse } from 'next/server'
import { getBijouById } from '@/lib/database'
import { getDatabaseAdapter } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, validateProductId, requireCSRF } from '@/lib/security'
import type { DatabaseProduct } from '@/lib/types'
import { updateProductSchema } from '@/lib/validations'
import { z } from 'zod'
import { select, execute, executeQuery, testConnection, initializeDatabase, detectDriver } from '@/lib/sqlite'
import type { Product } from '@/lib/db/types'

type ProductRow = DatabaseProduct & { images?: string | string[] | null }

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET - Récupérer un produit par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateProductId(id)) {
      return NextResponse.json(
        { error: 'ID produit invalide' },
        { status: 400 }
      )
    }
    
    logger.db(`Récupération produit ${id}`, true)

    // PRIORITÉ 1: Utiliser getBijouById qui détecte automatiquement Supabase/Postgres/SQLite
    try {
      const product = await getBijouById(id)
      if (product) {
        // Parser les images
        let imagesArray: string[] = []
        if (product.images) {
          if (Array.isArray(product.images)) {
            imagesArray = product.images
          } else if (typeof product.images === 'string') {
            try {
              imagesArray = JSON.parse(product.images)
            } catch {
              imagesArray = [product.images]
            }
          }
        }
        
        // Retourner image_url brute pour que l'admin puisse afficher et ré-enregistrer les chemins locaux (C:\...)
        const rawImageUrl = product.image_url || (product as { main_image?: string }).main_image || null
        const responseProduct = {
          id: String(product.id),
          name: product.name,
          name_ar: product.name_ar || null,
          description: product.description || null,
          price: product.price,
          original_price: product.original_price || null,
          category: product.category_id || (product as { category?: string }).category || 'Général',
          stock: (product as { stock?: number }).stock || 0,
          is_active: product.is_available !== false,
          image_url: rawImageUrl,
          main_image: rawImageUrl,
          images: imagesArray,
          created_at: product.created_at || new Date().toISOString(),
          updated_at: (product as { updated_at?: string }).updated_at || new Date().toISOString()
        }
        
        logger.db(`Produit ${id} récupéré via adapter`, true)
        return NextResponse.json(responseProduct)
      }
    } catch (adapterError) {
      if (adapterError instanceof Error) {
        logger.warn('[GET /api/products/[id]] Adapter failed, fallback to SQLite:', { error: adapterError.message })
      } else {
        logger.warn('[GET /api/products/[id]] Adapter failed, fallback to SQLite:', { error: String(adapterError) })
      }
    }

    // FALLBACK: SQLite direct si adapter échoue
    const isConnected = testConnection()
    if (!isConnected) {
      logger.warn('Connexion SQLite indisponible')
      return NextResponse.json(
        { error: 'Base de données indisponible. Veuillez réessayer plus tard.' },
        { status: 503 }
      )
    }

    initializeDatabase()
    const products = select('SELECT * FROM products WHERE id = ?', [id]) as ProductRow[]
    
    if (products.length === 0) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const product = products[0]
    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
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
    
    const rawImageUrl = product.image_url || null
    const responseProduct = {
      id: product.id,
      name: product.name,
      name_ar: product.name_ar,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      category: product.category,
      stock: product.stock,
      is_active: product.is_active,
      image_url: rawImageUrl,
      main_image: rawImageUrl,
      images: imagesArray,
      created_at: product.created_at,
      updated_at: product.updated_at
    }
    
    logger.db(`Produit ${id} récupéré via SQLite fallback`, true)
    return NextResponse.json(responseProduct)
  } catch (error) {
    logger.error('Erreur API produits', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// PUT - Modifier un produit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const { id } = await params
    // Vérifier les permissions admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent modifier des produits.' },
        { status: 403 }
      )
    }
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateProductId(id)) {
      return NextResponse.json(
        { error: 'ID produit invalide' },
        { status: 400 }
      )
    }
    
    const body = await request.json()

    // SÉCURITÉ: Validation avec Zod
    let validatedData: z.infer<typeof updateProductSchema>
    try {
      validatedData = updateProductSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((err) => {
          const path = err.path.join('.')
          return path ? `${path}: ${err.message}` : err.message
        })
        return NextResponse.json(
          { error: 'Données invalides', details: errors },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Erreur de validation' },
        { status: 400 }
      )
    }

    // Récupérer le produit existant (adapter ou SQLite - même source que GET)
    const existingFromAdapter = await getBijouById(id)
    if (!existingFromAdapter) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const existingProduct = existingFromAdapter as Product & { category?: string; images?: string | string[]; image_url?: string }
    const existingCategory = existingProduct.category || (existingProduct as { category_id?: string }).category_id || 'Général'
    const existingImages = existingProduct.images

    // SÉCURITÉ: Sanitization
    const sanitizedName = validatedData.name ? sanitizeInput(validatedData.name) : existingProduct.name
    const sanitizedNameAr = validatedData.name_ar !== undefined ? (validatedData.name_ar ? sanitizeInput(validatedData.name_ar) : null) : existingProduct.name_ar
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : existingProduct.description
    const sanitizedCategory = validatedData.category ? sanitizeInput(validatedData.category) : existingCategory

    const finalImageUrl = validatedData.main_image ?? validatedData.image_url ?? existingProduct.image_url ?? existingProduct.main_image ?? null
    const imagesForPayload = validatedData.images && validatedData.images.length > 0
      ? validatedData.images
      : (Array.isArray(existingImages) ? existingImages : typeof existingImages === 'string' ? (() => { try { return JSON.parse(existingImages) } catch { return [] } })() : [])

    logger.db(`Modification produit ${id}`, true)

    // PRIORITÉ 1: Mise à jour via l'adapter (Supabase / etc.)
    try {
      const adapter = await getDatabaseAdapter()
      if (typeof adapter.updateProduct === 'function') {
        const updatePayload: Partial<Product> & { images?: string } = {
          name: sanitizedName,
          name_ar: sanitizedNameAr ?? undefined,
          description: sanitizedDescription,
          price: validatedData.price ?? existingProduct.price,
          original_price: validatedData.original_price ?? existingProduct.original_price ?? undefined,
          category: sanitizedCategory,
          category_id: sanitizedCategory,
          stock: validatedData.stock ?? existingProduct.stock ?? 0,
          is_active: validatedData.is_active !== undefined ? validatedData.is_active : (existingProduct.is_active ?? existingProduct.is_available !== false),
          image_url: finalImageUrl ?? undefined,
          main_image: finalImageUrl ?? undefined,
          images: imagesForPayload.length > 0 ? JSON.stringify(imagesForPayload) : undefined,
        }
        const updated = await adapter.updateProduct(id, updatePayload)
        if (updated) {
          const productAfter = await getBijouById(id)
          if (productAfter) {
            const imgUrl = (productAfter as { image_url?: string }).image_url || (productAfter as { main_image?: string }).main_image || null
            const imgs = (productAfter as { images?: string[] | string }).images
            const imagesArray = Array.isArray(imgs) ? imgs : (typeof imgs === 'string' ? (() => { try { return JSON.parse(imgs) } catch { return [] } })() : [])
            logger.db(`Produit ${id} modifié via adapter`, true)
            return NextResponse.json({
              id: productAfter.id,
              name: productAfter.name,
              price: productAfter.price,
              main_image: imgUrl,
              images: imagesArray
            })
          }
        }
        // Adapter utilisé mais updateProduct a échoué → ne pas basculer sur SQLite (données dans Supabase)
        logger.warn('[PUT /api/products/[id]] Adapter updateProduct a échoué (retour false)')
        return NextResponse.json(
          { error: 'La modification du produit a échoué. Veuillez réessayer.' },
          { status: 500 }
        )
      }
    } catch (adapterError) {
      if (adapterError instanceof Error) {
        logger.warn('[PUT /api/products/[id]] Adapter failed, fallback SQLite:', { error: adapterError.message })
      } else {
        logger.warn('[PUT /api/products/[id]] Adapter failed, fallback SQLite:', { error: String(adapterError) })
      }
    }

    // FALLBACK: SQLite (uniquement si l'adapter a levé une exception, pas si update a retourné false)
    const isConnected = testConnection()
    if (!isConnected) {
      logger.warn('Connexion SQLite indisponible')
      return NextResponse.json(
        { error: 'Base de données indisponible. Veuillez réessayer plus tard.' },
        { status: 503 }
      )
    }
    initializeDatabase()

    const existingProducts = select('SELECT * FROM products WHERE id = ?', [id]) as ProductRow[]
    if (existingProducts.length === 0) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
    const existingRow = existingProducts[0]
    if (!existingRow) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    if (validatedData.category) {
      const catRows = select('SELECT id FROM categories WHERE name = ? OR slug = ?', [sanitizedCategory, sanitizedCategory]) as { id: number }[]
      if (!catRows || catRows.length === 0) {
        return NextResponse.json(
          { error: 'Catégorie inexistante. Veuillez choisir une catégorie valide.' },
          { status: 400 }
        )
      }
    }

    const imagesJson = imagesForPayload.length > 0
      ? JSON.stringify(imagesForPayload)
      : (existingRow.images ? (typeof existingRow.images === 'string' ? existingRow.images : JSON.stringify(existingRow.images)) : null)

    const updateResult = execute(`
      UPDATE products 
      SET name = ?, name_ar = ?, description = ?, price = ?, original_price = ?, 
          category = ?, stock = ?, is_active = ?, image_url = ?, images = ?, updated_at = ?
      WHERE id = ?
    `, [
      sanitizedName ?? existingRow.name,
      sanitizedNameAr ?? existingRow.name_ar,
      sanitizedDescription ?? existingRow.description,
      validatedData.price ?? existingRow.price,
      validatedData.original_price ?? existingRow.original_price,
      sanitizedCategory ?? existingRow.category,
      validatedData.stock ?? existingRow.stock,
      validatedData.is_active !== undefined ? Boolean(validatedData.is_active) : existingRow.is_active,
      finalImageUrl,
      imagesJson,
      new Date().toISOString(),
      id
    ]) as { changes: number }
    if (updateResult.changes === 0) {
      return NextResponse.json(
        { error: 'Aucune modification effectuée. Le produit n\'existe peut-être plus.' },
        { status: 404 }
      )
    }

    const products = select('SELECT * FROM products WHERE id = ?', [id]) as ProductRow[]
    const product = products[0]
    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
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
    logger.db(`Produit ${id} modifié via SQLite`, true)
    return NextResponse.json({
      id: product.id,
      name: product.name,
      price: product.price,
      main_image: product.image_url || null,
      images: imagesArray
    })
  } catch (error) {
    logger.error('Erreur API produits', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un produit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // SÉCURITÉ: Validation CSRF
    const csrfCheck = await requireCSRF(request)
    if (!csrfCheck.valid) {
      return csrfCheck.error
    }

    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateProductId(id)) {
      logger.warn(`[DELETE /api/products/${id}] ID invalide`)
      return NextResponse.json(
        { error: 'ID produit invalide' },
        { status: 400 }
      )
    }
    
    // Vérifier les permissions admin
    const user = await getCurrentUser()
    if (!user || user.role !== 'admin') {
      logger.warn(`[DELETE /api/products/${id}] Tentative de suppression sans autorisation admin`)
      return NextResponse.json(
        { error: 'Accès non autorisé. Seuls les administrateurs peuvent supprimer des produits.' },
        { status: 403 }
      )
    }
    
    logger.db(`Suppression produit ${id}`, true)

    // PRIORITÉ 1: Utiliser l'adapter (Supabase/Postgres) si disponible
    try {
      const adapter = await getDatabaseAdapter()
      const deleted = await adapter.deleteProduct(id)
      if (deleted) {
        logger.db(`Produit ${id} supprimé via adapter`, true)
        return NextResponse.json(
          { message: 'Produit supprimé avec succès' },
          { status: 200 }
        )
      }
    } catch (adapterError) {
      if (adapterError instanceof Error) {
        logger.warn('[DELETE /api/products/[id]] Adapter failed, fallback to SQLite:', { error: adapterError.message })
      } else {
        logger.warn('[DELETE /api/products/[id]] Adapter failed, fallback to SQLite:', { error: String(adapterError) })
      }
    }

    // FALLBACK: SQLite
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

    // Vérifier d'abord si le produit existe
    const existingProducts = select('SELECT id, name FROM products WHERE id = ?', [id]) as Array<Pick<DatabaseProduct, 'id' | 'name'>>
    
    if (existingProducts.length === 0) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    const existingProduct = existingProducts[0]
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le produit
    // Utiliser executeQuery qui gère better-sqlite3 et sql.js correctement
    const deleteResult = executeQuery('DELETE FROM products WHERE id = ?', [id])
    
    // Pour sql.js, vérifier manuellement si la suppression a réussi
    const driver = detectDriver()
    let deletionSuccessful = false
    
    if (driver === 'sqljs') {
      // Pour sql.js, vérifier si le produit existe encore après DELETE
      const checkAfterDelete = select('SELECT id FROM products WHERE id = ?', [id]) as Array<{ id: number }>
      deletionSuccessful = checkAfterDelete.length === 0
    } else {
      // Pour better-sqlite3, utiliser changes
      deletionSuccessful = deleteResult.changes > 0
    }
    
    if (!deletionSuccessful) {
      // Double vérification : peut-être que le produit a été supprimé entre-temps
      const doubleCheck = select('SELECT id FROM products WHERE id = ?', [id]) as Array<{ id: number }>
      if (doubleCheck.length === 0) {
        // Le produit n'existe vraiment plus
        return NextResponse.json(
          { 
            error: 'Produit non trouvé',
            message: 'Le produit a peut-être déjà été supprimé.'
          },
          { status: 404 }
        )
      } else {
        // Problème inattendu - le produit existe mais DELETE retourne 0 changes
        logger.error(`[DELETE /api/products/${id}] Échec suppression: produit existe mais DELETE retourne 0 changes`, { id, existingProduct })
        
        // Essayer de supprimer à nouveau avec executeQuery
        try {
          const retryResult = executeQuery('DELETE FROM products WHERE id = ?', [id])
          const retryDriver = detectDriver()
          let retrySuccessful = false
          
          if (retryDriver === 'sqljs') {
            const checkAfterRetry = select('SELECT id FROM products WHERE id = ?', [id]) as Array<{ id: number }>
            retrySuccessful = checkAfterRetry.length === 0
          } else {
            retrySuccessful = retryResult.changes > 0
          }
          
          if (retrySuccessful) {
            logger.db(`Produit "${existingProduct.name}" supprimé après retry`, true)
            return NextResponse.json(
              { message: `Produit "${existingProduct.name}" supprimé avec succès` },
              { status: 200 }
            )
          }
        } catch (retryError) {
          logger.error(`[DELETE /api/products/${id}] Erreur lors du retry:`, retryError)
        }
        
        return NextResponse.json(
          { 
            error: 'Erreur lors de la suppression',
            message: 'Le produit existe mais n\'a pas pu être supprimé. Veuillez réessayer.'
          },
          { status: 500 }
        )
      }
    }

    logger.db(`Produit "${existingProduct.name}" supprimé`, true)
    return NextResponse.json(
      { message: `Produit "${existingProduct.name}" supprimé avec succès` },
      { status: 200 }
    )
  } catch (error) {
    logger.error('Erreur API produits DELETE', error)
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { 
        error: 'Erreur interne du serveur',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}
