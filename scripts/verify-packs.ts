/**
 * Script de vérification des images packs
 * Vérifie que tous les chemins d'images référencés dans la DB existent dans public/
 * 
 * Usage: npx tsx scripts/verify-packs.ts
 */

import Database from 'better-sqlite3'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'
import { normalizeImageUrl } from '@/lib/image-path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')
const publicDir = join(process.cwd(), 'public')

interface PackImageCheck {
  packId: string
  packName: string
  imagePath: string
  normalizedPath: string
  exists: boolean
  error?: string
}

function getAllImagePaths(): string[] {
  const imagePaths: string[] = []
  
  // Parcourir récursivement public/images
  function walkDir(dir: string, basePath: string = '') {
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        const relativePath = join(basePath, entry.name).replace(/\\/g, '/')
        
        if (entry.isDirectory()) {
          walkDir(fullPath, relativePath)
        } else if (entry.isFile()) {
          // Ajouter le chemin web (commence par /)
          imagePaths.push(`/${relativePath}`)
        }
      }
    } catch (error) {
      console.warn(`⚠️  Impossible de lire le dossier: ${dir}`)
    }
  }
  
  const imagesDir = join(publicDir, 'images')
  if (existsSync(imagesDir)) {
    walkDir(imagesDir, 'images')
  }
  
  // Ajouter placeholder
  if (existsSync(join(publicDir, 'placeholder.svg'))) {
    imagePaths.push('/placeholder.svg')
  }
  
  return imagePaths
}

async function verifyPackImages() {
  console.log('🔍 Vérification des images packs...\n')
  
  // Vérifier que la DB existe
  if (!existsSync(dbPath)) {
    console.error(`❌ Base de données non trouvée: ${dbPath}`)
    console.error('💡 Exécutez d\'abord: npm run db:seed')
    process.exit(1)
  }
  
  const db = new Database(dbPath)
  
  try {
    // Récupérer tous les packs
    const packs = db.prepare(`
      SELECT id, name, image_url
      FROM packs
    `).all() as Array<{
      id: number
      name: string
      image_url: string | null
    }>
    
    console.log(`📦 ${packs.length} pack(s) trouvé(s)\n`)
    
    // Récupérer tous les chemins d'images disponibles
    const availableImages = getAllImagePaths()
    console.log(`📁 ${availableImages.length} image(s) trouvée(s) dans public/\n`)
    
    const checks: PackImageCheck[] = []
    
    // Vérifier chaque pack
    for (const pack of packs) {
      const packId = String(pack.id)
      
      // Vérifier image_url
      if (pack.image_url) {
        const normalized = normalizeImageUrl(pack.image_url)
        const exists = availableImages.includes(normalized) || existsSync(join(publicDir, normalized.substring(1)))
        checks.push({
          packId,
          packName: pack.name,
          imagePath: pack.image_url,
          normalizedPath: normalized,
          exists,
          error: exists ? undefined : 'Image pack manquante'
        })
      } else {
        checks.push({
          packId,
          packName: pack.name,
          imagePath: '',
          normalizedPath: '',
          exists: false,
          error: 'Aucune image définie'
        })
      }
    }
    
    // Résumé
    const missing = checks.filter(c => !c.exists)
    const found = checks.filter(c => c.exists)
    
    console.log('📊 Résumé:')
    console.log(`   ✅ Images trouvées: ${found.length}`)
    console.log(`   ❌ Images manquantes: ${missing.length}\n`)
    
    if (missing.length > 0) {
      console.log('❌ Images manquantes:\n')
      for (const check of missing) {
        console.log(`   📦 ${check.packName} (ID: ${check.packId}):`)
        if (check.normalizedPath) {
          console.log(`      - ${check.normalizedPath}`)
          console.log(`        Original: ${check.imagePath}`)
        } else {
          console.log(`      - ${check.error}`)
        }
        console.log()
      }
      
      console.log('💡 Solutions:')
      console.log('   1. Vérifiez que les fichiers existent dans public/images/packs/')
      console.log('   2. Vérifiez les chemins dans la base de données')
      console.log('   3. Utilisez des chemins relatifs commençant par /images/packs/')
    } else {
      console.log('✅ Toutes les images packs sont présentes!\n')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

verifyPackImages().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

