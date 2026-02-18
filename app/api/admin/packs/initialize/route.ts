/**
 * Route API pour initialiser les packs officiels
 * - Supprime les packs existants
 * - Insère les 14 packs officiels avec leurs images
 * 
 * ⚠️ REQUIS : Rôle ADMIN
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
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
    let deletedCount = 0
    
    for (const pack of allPacks) {
      try {
        await deletePack(String(pack.id))
        deletedCount++
        logger.info(`🗑️ Pack supprimé: ${pack.name} (${pack.id})`)
      } catch (error) {
        logger.error(`Erreur lors de la suppression du pack ${pack.id}:`, { error: error instanceof Error ? error.message : String(error) })
      }
    }
    
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
      // Vérifier les permissions ADMIN
      const adminUser = await requireAdmin()
      
      logger.info(`🚀 Initialisation des packs officiels par ${adminUser.phone}`)
    
    // Étape 1: Supprimer les packs existants
    logger.info('📋 Étape 1: Suppression des packs existants...')
    const deletedCount = await clearExistingPacks()
    
    // Étape 2: Copier les images vers public/images/packs/
    logger.info('📋 Étape 2: Copie des images...')
    const sourceDir = path.join('C:', 'Users', 'hassa', 'Desktop', 'pack inoxya')
    const imagePaths: string[] = []
    
    for (const pack of OFFICIAL_PACKS) {
      try {
        // Gérer les noms de fichiers avec espaces
        const sourceFileName = pack.main_image.trim()
        const sourcePath = path.join(sourceDir, sourceFileName)
        
        // Vérifier que le fichier existe
        await fs.access(sourcePath)
        
        // Générer un nom de fichier unique basé sur le slug
        const slug = generateSlug(pack.name)
        const ext = path.extname(sourceFileName) || '.jpg'
        const targetFileName = `${slug}${ext}`
        
        // Copier l'image
        const imageUrl = await copyImageToPublic(sourcePath, targetFileName)
        imagePaths.push(imageUrl)
        logger.info(`✅ Image copiée pour ${pack.name}: ${targetFileName}`)
      } catch (error) {
        logger.warn(`⚠️ Image non trouvée pour ${pack.name}: ${pack.main_image}`, { error: error instanceof Error ? error.message : String(error) })
        // Utiliser un placeholder si l'image n'existe pas
        imagePaths.push('/images/placeholder-pack.jpg')
      }
    }
    
    // Étape 3: Insérer les 14 packs officiels
    logger.info('📋 Étape 3: Insertion des 14 packs officiels...')
    const insertedPacks = []
    
    for (let i = 0; i < OFFICIAL_PACKS.length; i++) {
      const packData = OFFICIAL_PACKS[i]
      if (!packData) continue // Sécurité TypeScript
      
      const imageUrl = imagePaths[i] || ''
      
      try {
        const slug = generateSlug(packData.name)
        
        // Créer le pack avec price = current_price
        // Note: original_price sera géré via updatePack si la table le supporte
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
        
        // Si le pack a été créé et qu'on a un original_price différent, essayer de le mettre à jour
        if (newPack && packData.original_price !== packData.current_price) {
          try {
            // Vérifier si la table supporte original_price
            // Si oui, on peut faire un UPDATE
            await updatePack(newPack.id, {
              // On met original_price dans la description si la colonne n'existe pas
              description: `Pack officiel INOXYA - ${packData.name}. Prix original: ${packData.original_price} MAD, Prix actuel: ${packData.current_price} MAD.`
            })
          } catch (error) {
            // Ignorer si original_price n'est pas supporté
            logger.debug(`original_price non supporté pour ${packData.name}`)
          }
        }
        
        if (newPack && newPack.id) {
          insertedPacks.push({ id: newPack.id, name: packData.name })
          logger.info(`✅ Pack créé avec succès: ${packData.name} (ID: ${newPack.id})`)
        } else {
          logger.error(`❌ Échec de création du pack: ${packData.name}`)
        }
      } catch (error) {
        logger.error(`❌ Erreur lors de la création du pack ${packData.name}:`, error)
      }
    }
    
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

