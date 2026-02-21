/**
 * Route API pour vérifier tous les packs et leurs images
 * Vérifie que les packs sont réels et que leurs images existent
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { getAllPacks } from '@/lib/database'
import { logger } from '@/lib/logger'
import { promises as fs } from 'fs'
import path from 'path'

// Marquer comme dynamique pour éviter le prerendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PackVerification {
  pack: {
    id: string
    name: string
    slug: string
    price: number
    image_url?: string
    is_featured: boolean
    created_at: string
  }
  imageExists: boolean
  imagePath?: string
  /** 'local' = chemin disque Windows/local, affichable via /api/admin/serve-local-image */
  imagePathType?: 'web' | 'relative' | 'local'
  imageError?: string
  isValid: boolean
}

export async function GET(_request: NextRequest) {
  try {
    // Vérifier les permissions ADMIN
    await requireAdmin()
    
    logger.info('🔍 Vérification de tous les packs...')
    
    // Récupérer tous les packs
    const allPacks = await getAllPacks()
    
    logger.info(`📦 ${allPacks.length} pack(s) trouvé(s)`)
    
    type PackWithCreatedAt = typeof allPacks[number] & { created_at?: string }

    const verifications = await Promise.all(
      allPacks.map(async (pack): Promise<PackVerification> => {
        const verification: PackVerification = {
          pack: {
            id: pack.id,
            name: pack.name,
            slug: pack.slug,
            price: pack.price,
            image_url: pack.image_url,
            is_featured: pack.is_featured,
            created_at: (pack as PackWithCreatedAt).created_at || new Date().toISOString()
          },
          imageExists: false,
          isValid: false
        }

        let imageUrl = typeof pack.image_url === 'string' ? pack.image_url.trim() : ''
        if (imageUrl.startsWith('"') && imageUrl.endsWith('"')) {
          imageUrl = imageUrl.slice(1, -1)
        }

        if (imageUrl) {
          try {
            if (imageUrl.startsWith('/')) {
              const imagePath = path.join(process.cwd(), 'public', imageUrl)
              await fs.access(imagePath)
              verification.imageExists = true
              verification.imagePath = imageUrl
              verification.imagePathType = 'relative'
              logger.info(`✅ Image trouvée pour ${pack.name}: ${imageUrl}`)
            } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
              try {
                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 5000)
                const response = await fetch(imageUrl, { method: 'HEAD', signal: controller.signal })
                clearTimeout(timeoutId)
                verification.imageExists = response.ok
                verification.imagePath = imageUrl
                verification.imagePathType = 'web'
                if (response.ok) {
                  logger.info(`✅ Image externe accessible pour ${pack.name}: ${imageUrl}`)
                } else {
                  logger.warn(`⚠️ Image externe inaccessible pour ${pack.name}: ${imageUrl}`, { status: response.status })
                  verification.imageError = `HTTP ${response.status}`
                }
              } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                  verification.imageError = 'Timeout (5s)'
                } else {
                  verification.imageError = error instanceof Error ? error.message : 'Erreur de connexion'
                }
                logger.warn(`⚠️ Erreur lors de la vérification de l'image externe pour ${pack.name}:`, { error: error instanceof Error ? error.message : String(error) })
              }
            } else if (/^[A-Za-z]:\\/i.test(imageUrl) || imageUrl.includes('\\') || imageUrl.startsWith('/Users/') || imageUrl.startsWith('/home/')) {
              const localPath = path.normalize(imageUrl)
              await fs.access(localPath)
              verification.imageExists = true
              verification.imagePath = imageUrl
              verification.imagePathType = 'local'
              logger.info(`✅ Image locale trouvée pour ${pack.name}: ${imageUrl}`)
            } else {
              verification.imageError = 'Format de chemin non reconnu'
              logger.warn(`⚠️ Format de chemin non reconnu pour ${pack.name}: ${imageUrl}`, { imageUrl })
            }
          } catch (error) {
            verification.imageError = error instanceof Error ? error.message : 'Fichier non trouvé'
            logger.warn(`⚠️ Image non trouvée pour ${pack.name}: ${imageUrl}`, { error: error instanceof Error ? error.message : String(error) })
          }
        } else {
          verification.imageError = 'Aucune image définie'
          logger.warn(`⚠️ Aucune image définie pour ${pack.name}`)
        }

        verification.isValid =
          !!pack.name &&
          pack.name.trim().length > 0 &&
          pack.price > 0 &&
          verification.imageExists

        return verification
      })
    )
    
    // Statistiques
    const validPacks = verifications.filter(v => v.isValid).length
    const invalidPacks = verifications.filter(v => !v.isValid).length
    const packsWithImages = verifications.filter(v => v.imageExists).length
    const packsWithoutImages = verifications.filter(v => !v.imageExists).length
    
    logger.info(`✅ Vérification terminée: ${validPacks} pack(s) valide(s), ${invalidPacks} pack(s) invalide(s)`)
    logger.info(`📸 Images: ${packsWithImages} trouvée(s), ${packsWithoutImages} manquante(s)`)
    
    return NextResponse.json({
      success: true,
      total: allPacks.length,
      valid: validPacks,
      invalid: invalidPacks,
      withImages: packsWithImages,
      withoutImages: packsWithoutImages,
      verifications: verifications
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    logger.error('❌ Erreur lors de la vérification des packs:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}

