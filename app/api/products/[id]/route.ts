import { NextRequest, NextResponse } from 'next/server'
import { select, execute, executeQuery, testConnection, initializeDatabase, detectDriver } from '@/lib/sqlite'
import { getCurrentUser } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { sanitizeInput, validateNumericId, requireCSRF } from '@/lib/security'
import { normalizeImageUrl } from '@/lib/image-path'
import type { DatabaseProduct } from '@/lib/types'
import { updateProductSchema } from '@/lib/validations'
import { z } from 'zod'

type ProductRow = DatabaseProduct & { images?: string | string[] | null }

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// GET - Récupérer un produit par ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // SÉCURITÉ: Validation de l'ID
    if (!validateNumericId(id)) {
      return NextResponse.json(
        { error: 'ID produit invalide' },
        { status: 400 }
      )
    }
    
    logger.db(`Récupération produit ${id}`, true)

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

    // Récupérer le produit par ID
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
      } catch (e) {
        imagesArray = []
      }
    } else if (Array.isArray(product.images)) {
      imagesArray = product.images
    }
    
    // Production: normaliser les chemins d'images (éviter chemins absolus Windows)
    const imageUrlNorm = normalizeImageUrl(product.image_url || null)
    const imagesNorm = imagesArray.map((img) => normalizeImageUrl(img))
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
      image_url: imageUrlNorm,
      main_image: imageUrlNorm,
      images: imagesNorm,
      created_at: product.created_at,
      updated_at: product.updated_at
    }
    
    logger.db(`Produit ${id} récupéré`, true)
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
    if (!validateNumericId(id)) {
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

    // Récupérer le produit existant pour les valeurs par défaut
    const existingProducts = select('SELECT * FROM products WHERE id = ?', [id]) as ProductRow[]
    if (existingProducts.length === 0) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      )
    }
    const existingProduct = existingProducts[0]!
    
    // SÉCURITÉ: Sanitization des entrées utilisateur (après validation Zod)
    const sanitizedName = validatedData.name ? sanitizeInput(validatedData.name) : existingProduct.name
    const sanitizedNameAr = validatedData.name_ar !== undefined ? (validatedData.name_ar ? sanitizeInput(validatedData.name_ar) : null) : existingProduct.name_ar
    const sanitizedDescription = validatedData.description ? sanitizeInput(validatedData.description) : existingProduct.description
    const sanitizedCategory = validatedData.category ? sanitizeInput(validatedData.category) : existingProduct.category

    logger.db(`Modification produit ${id}`, true)

    // Tester la connexion et initialiser la base si nécessaire
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

    // RÈGLE MÉTIER: Vérifier que la catégorie existe en base (si catégorie fournie)
    if (validatedData.category) {
      const catRows = select('SELECT id FROM categories WHERE name = ? OR slug = ?', [sanitizedCategory, sanitizedCategory]) as { id: number }[]
      if (!catRows || catRows.length === 0) {
        return NextResponse.json(
          { error: 'Catégorie inexistante. Veuillez choisir une catégorie valide.' },
          { status: 400 }
        )
      }
    }

    // Utiliser main_image si fourni, sinon image_url, sinon valeur existante
    const finalImageUrl = validatedData.main_image || validatedData.image_url || existingProduct.image_url || null
    
    // Préparer les images secondaires (convertir array en JSON string si nécessaire)
    const imagesJson = validatedData.images && validatedData.images.length > 0
      ? JSON.stringify(validatedData.images)
      : (existingProduct.images ? (typeof existingProduct.images === 'string' ? existingProduct.images : JSON.stringify(existingProduct.images)) : null)

    // SÉCURITÉ: Mettre à jour le produit avec données sanitizées (utiliser valeurs existantes si non fournies)
    const updateResult = execute(`
      UPDATE products 
      SET name = ?, name_ar = ?, description = ?, price = ?, original_price = ?, 
          category = ?, stock = ?, is_active = ?, image_url = ?, images = ?, updated_at = ?
      WHERE id = ?
    `, [
      sanitizedName ?? existingProduct.name,
      sanitizedNameAr ?? existingProduct.name_ar,
      sanitizedDescription ?? existingProduct.description,
      validatedData.price ?? existingProduct.price,
      validatedData.original_price ?? existingProduct.original_price,
      sanitizedCategory ?? existingProduct.category,
      validatedData.stock ?? existingProduct.stock,
      validatedData.is_active !== undefined ? Boolean(validatedData.is_active) : existingProduct.is_active,
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

    // Récupérer le produit modifié
    const products = select('SELECT * FROM products WHERE id = ?', [id]) as ProductRow[]
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
      } catch (e) {
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

    logger.db(`Produit ${id} modifié`, true)
    return NextResponse.json(responseProduct)
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
    if (!validateNumericId(id)) {
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
