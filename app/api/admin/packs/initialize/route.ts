/**
 * Route API pour initialiser les packs officiels
 * - Supprime les packs existants
 * - Insère les 14 packs officiels avec leurs images
 * 
 * ⚠️ REQUIS : Rôle ADMIN
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { requireCSRF } from '@/lib/security'
import { getAllPacks } from '@/lib/database'
import { createPack, updatePack, deletePack } from '@/lib/pack-management'
import { logger } from '@/lib/logger'
import { promises as fs } from 'fs'
import path from 'path'

// PHASE 1: Forcer Node runtime (better-sqlite3 nécessite Node, pas Edge)
export const runtime = 'nodejs'

// Définition des 14 packs officiels
const OFFICIAL_PACKS = [
  {
    name: "Pack Prestige",
    original_price: 299,
    current_price: 149,
    main_image: "pack14.jpg"
  },
  {
    name: "Pack Émeraude",
    original_price: 399,
    current_price: 219,
    main_image: "pack13.jpg"
  },
  {
    name: "Pack Doré Luxe",
    original_price: 599,
    current_price: 299,
    main_image: "pack12.jpg"
  },
  {
    name: "Pack Cloue",
    original_price: 799,
    current_price: 449,
    main_image: "pack11.jpg"
  },
  {
    name: "Pack Cloue Soft",
    original_price: 999,
    current_price: 599,
    main_image: "pack10.jpg"
  },
  {
    name: "Pack Élegancia",
    original_price: 1299,
    current_price: 749,
    main_image: "pack9.jpg"
  },
  {
    name: "Pack Éclat Suprême",
    original_price: 1599,
    current_price: 999,
    main_image: "pack8.jpg"
  },
  {
    name: "Pack Trêfle",
    original_price: 349,
    current_price: 199,
    main_image: "pack6.jpg"
  },
  {
    name: "Pack Royal",
    original_price: 549,
    current_price: 329,
    main_image: "pack5.jpg"
  },
  {
    name: "Pack Papillon",
    original_price: 699,
    current_price: 419,
    main_image: "pack4.jpg"
  },
  {
    name: "Pack Impérial",
    original_price: 400,
    current_price: 350,
    main_image: "pack3.jpg"
  },
  {
    name: "Pack Glamour",
    original_price: 449,
    current_price: 269,
    main_image: "pack2.jpg"
  },
  {
    name: "Pack Doré Luxe",
    original_price: 499,
    current_price: 299,
    main_image: "pack1.jpeg"
  },
  {
    name: "Pack Black Titanium",
    original_price: 599,
    current_price: 359,
    main_image: "pack 7.jpg"
  }
]

/**
 * Copier une image depuis le dossier source vers public/images/packs/
 */
async function copyImageToPublic(sourcePath: string, targetFileName: string): Promise<string> {
  try {
    const publicDir = path.join(process.cwd(), 'public', 'images', 'packs')
    
    // Créer le dossier s'il n'existe pas
    await fs.mkdir(publicDir, { recursive: true })
    
    const targetPath = path.join(publicDir, targetFileName)
    
    // Copier le fichier
    await fs.copyFile(sourcePath, targetPath)
    
    logger.info(`✅ Image copiée: ${targetFileName}`)
    
    // Retourner le chemin relatif pour la base de données
    return `/images/packs/${targetFileName}`
  } catch (error) {
    logger.error(`❌ Erreur lors de la copie de l'image ${sourcePath}:`, error)
    throw error
  }
}

/**
 * Supprimer tous les packs existants avant insertion
 */
async function clearExistingPacks() {
  try {
    const allPacks = await getAllPacks()
    const results = await Promise.allSettled(
      allPacks.map((pack) => deletePack(String(pack.id)))
    )
    let deletedCount = 0
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        deletedCount++
        const pack = allPacks[index]
        if (pack) logger.info(`🗑️ Pack supprimé: ${pack.name} (${pack.id})`)
      } else {
        const pack = allPacks[index]
        if (pack) {
          logger.error(`Erreur lors de la suppression du pack ${pack.id}:`, { error: result.reason instanceof Error ? result.reason.message : String(result.reason) })
        }
      }
    })
    logger.info(`✅ ${deletedCount} pack(s) supprimé(s)`)
    return deletedCount
  } catch (error) {
    logger.error('Erreur lors de la suppression des packs:', error)
    throw error
  }
}

/**
 * Générer un slug à partir du nom
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(_request: NextRequest) {
  // TIMEOUT: Route longue, timeout de 60 secondes
  const timeoutMs = 60000 // 60 secondes
  const timeoutPromise = new Promise<NextResponse>((resolve) => {
    setTimeout(() => {
      logger.error('[POST /api/admin/packs/initialize] Timeout après 60 secondes')
      resolve(NextResponse.json(
        { error: 'Initialisation timeout: opération trop longue. Veuillez réessayer.' },
        { status: 504 }
      ))
    }, timeoutMs)
  })

  const initializePromise = (async () => {
    try {
      const csrfCheck = await requireCSRF(_request)
      if (!csrfCheck.valid) return csrfCheck.error

      // Vérifier les permissions ADMIN
      const adminUser = await requireAdmin()
      
      logger.info(`🚀 Initialisation des packs officiels par ${adminUser.phone}`)
    
    // Étape 1: Supprimer les packs existants
    logger.info('📋 Étape 1: Suppression des packs existants...')
    const deletedCount = await clearExistingPacks()
    
    // Étape 2: Copier les images vers public/images/packs/
    logger.info('📋 Étape 2: Copie des images...')
    const sourceDir = path.join('C:', 'Users', 'hassa', 'Desktop', 'pack inoxya')
    const imagePaths = await Promise.all(
      OFFICIAL_PACKS.map(async (pack) => {
        try {
          const sourceFileName = pack.main_image.trim()
          const sourcePath = path.join(sourceDir, sourceFileName)
          await fs.access(sourcePath)
          const slug = generateSlug(pack.name)
          const ext = path.extname(sourceFileName) || '.jpg'
          const targetFileName = `${slug}${ext}`
          const imageUrl = await copyImageToPublic(sourcePath, targetFileName)
          logger.info(`✅ Image copiée pour ${pack.name}: ${targetFileName}`)
          return imageUrl
        } catch (error) {
          logger.warn(`⚠️ Image non trouvée pour ${pack.name}: ${pack.main_image}`, { error: error instanceof Error ? error.message : String(error) })
          return '/images/placeholder-pack.jpg'
        }
      })
    )

    // Étape 3: Insérer les 14 packs officiels
    logger.info('📋 Étape 3: Insertion des 14 packs officiels...')
    const insertResults = await Promise.all(
      OFFICIAL_PACKS.map(async (packData, i) => {
        const imageUrl = imagePaths[i] ?? ''
        try {
          const slug = generateSlug(packData.name)
          const newPackId = await createPack({
            name: packData.name,
            slug: slug,
            description: `Pack officiel INOXYA - ${packData.name}. Prix original: ${packData.original_price} MAD, Prix actuel: ${packData.current_price} MAD.`,
            price: packData.current_price,
            original_price: packData.original_price,
            image_url: imageUrl,
            images: [],
            category: 'general',
            tags: [],
            is_featured: true,
            is_active: true,
            stock_quantity: 100,
            min_items: 1,
            max_items: 5,
            discount: { type: 'percentage', value: 0 },
            composition: [],
            rating: 4.5,
            reviews_count: 0
          })
          const newPack = newPackId ? { id: newPackId } : null
          if (newPack && packData.original_price !== packData.current_price) {
            try {
              await updatePack(newPack.id, {
                description: `Pack officiel INOXYA - ${packData.name}. Prix original: ${packData.original_price} MAD, Prix actuel: ${packData.current_price} MAD.`
              })
            } catch {
              logger.debug(`original_price non supporté pour ${packData.name}`)
            }
          }
          if (newPack?.id) {
            logger.info(`✅ Pack créé avec succès: ${packData.name} (ID: ${newPack.id})`)
            return { id: newPack.id, name: packData.name }
          }
          logger.error(`❌ Échec de création du pack: ${packData.name}`)
          return null
        } catch (error) {
          logger.error(`❌ Erreur lors de la création du pack ${packData.name}:`, error)
          return null
        }
      })
    )
    const insertedPacks = insertResults.filter((p): p is { id: string; name: string } => p !== null)
    
      logger.info(`✅ Initialisation terminée: ${insertedPacks.length} pack(s) créé(s)`)
      
      return NextResponse.json({
        success: true,
        message: 'Packs officiels initialisés avec succès',
        deleted: deletedCount,
        inserted: insertedPacks.length,
        packs: insertedPacks
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      logger.error('[POST /api/admin/packs/initialize] Erreur lors de l\'initialisation des packs:', error)
      
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage 
        },
        { status: 500 }
      )
    }
  })()

  // Race entre l'initialisation et le timeout
  return Promise.race([initializePromise, timeoutPromise])
}

