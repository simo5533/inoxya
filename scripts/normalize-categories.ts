/**
 * Script de normalisation des catégories dans products.category
 * Convertit les valeurs numériques (1.0, 2.0, 3.0) en noms de catégories (Bagues, Colliers, Bracelets)
 * 
 * Usage:
 *   Dry-run (par défaut): npx tsx scripts/normalize-categories.ts
 *   Exécution: npx tsx scripts/normalize-categories.ts --execute
 */

import Database from 'better-sqlite3'
import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'
import { normalizeCategoryValue } from '@/lib/category-mapping'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')
const isDryRun = !process.argv.includes('--execute')

interface CategoryUpdate {
  oldValue: string
  newValue: string
  count: number
}

async function normalizeCategories(): Promise<void> {
  console.log('🔄 Normalisation des catégories dans products.category\n')
  console.log('=' .repeat(60) + '\n')

  if (!existsSync(dbPath)) {
    console.error(`❌ Base de données non trouvée: ${dbPath}`)
    process.exit(1)
  }

  if (!isDryRun) {
    console.log('🚨 MODE EXÉCUTION - Les catégories seront modifiées!\n')
  } else {
    console.log('⚠️  MODE DRY-RUN (aucune modification ne sera effectuée)\n')
    console.log('   Pour exécuter, utilisez: --execute\n')
  }

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  try {
    // 1. Analyser les valeurs actuelles
    console.log('📊 1. Analyse des valeurs actuelles:\n')
    const currentValues = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM products 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY count DESC
    `).all() as Array<{ category: string; count: number }>

    const updates: CategoryUpdate[] = []

    for (const { category, count } of currentValues) {
      const normalized = normalizeCategoryValue(category)
      if (normalized && normalized !== category) {
        updates.push({
          oldValue: category,
          newValue: normalized,
          count
        })
        console.log(`   "${category}" → "${normalized}" (${count} produit(s))`)
      } else if (normalized === category) {
        console.log(`   ✅ "${category}" (déjà correct, ${count} produit(s))`)
      } else {
        console.log(`   ⚠️  "${category}" (pas de correspondance, ${count} produit(s))`)
      }
    }
    console.log()

    if (updates.length === 0) {
      console.log('✅ Toutes les catégories sont déjà normalisées.\n')
      return
    }

    // 2. Créer un backup si exécution
    let backupPath: string | null = null
    if (!isDryRun) {
      console.log('💾 2. Création du backup...\n')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      backupPath = join(process.cwd(), 'data', `inoxya_bijoux.backup.${timestamp}.db`)
      copyFileSync(dbPath, backupPath)
      console.log(`   ✅ Backup créé: ${backupPath}\n`)
    }

    // 3. Appliquer les mises à jour
    if (!isDryRun) {
      console.log('🔄 3. Application des mises à jour...\n')
      
      db.transaction(() => {
        for (const update of updates) {
          const result = db.prepare(`
            UPDATE products 
            SET category = ?, updated_at = ?
            WHERE category = ? AND is_active = 1
          `).run(
            update.newValue,
            new Date().toISOString(),
            update.oldValue
          )
          console.log(`   ✅ "${update.oldValue}" → "${update.newValue}": ${result.changes} produit(s) mis à jour`)
        }
      })()
      console.log()
    } else {
      console.log('📋 3. Mises à jour qui seraient appliquées:\n')
      updates.forEach(update => {
        console.log(`   - "${update.oldValue}" → "${update.newValue}": ${update.count} produit(s)`)
      })
      console.log()
    }

    // 4. Vérification
    console.log('✅ 4. Vérification post-migration:\n')
    const finalValues = db.prepare(`
      SELECT category, COUNT(*) as count 
      FROM products 
      WHERE is_active = 1 
      GROUP BY category 
      ORDER BY count DESC
    `).all() as Array<{ category: string; count: number }>

    let allValid = true
    for (const { category, count } of finalValues) {
      const normalized = normalizeCategoryValue(category)
      if (normalized === category) {
        console.log(`   ✅ "${category}": ${count} produit(s)`)
      } else {
        console.log(`   ❌ "${category}": ${count} produit(s) (toujours invalide)`)
        allValid = false
      }
    }
    console.log()

    if (allValid) {
      console.log('✅ Toutes les catégories sont maintenant normalisées!\n')
      if (backupPath) {
        console.log(`💾 Backup disponible: ${backupPath}\n`)
      }
    } else {
      console.log('⚠️  Certaines catégories n\'ont pas pu être normalisées.\n')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la normalisation:', error)
    throw error
  } finally {
    db.close()
  }
}

normalizeCategories()
  .then(() => {
    console.log('✅ Normalisation terminée.\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

