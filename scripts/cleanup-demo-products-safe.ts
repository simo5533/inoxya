/**
 * Script SÉCURISÉ pour supprimer UNIQUEMENT les produits de démonstration
 * ⚠️ NE SUPPRIME PAS LES PHOTOS - Seulement les entrées en base de données
 * 
 * Usage:
 *   Dry-run: npx tsx scripts/cleanup-demo-products-safe.ts
 *   Exécution: npx tsx scripts/cleanup-demo-products-safe.ts --execute
 */

import path from 'path'
import fs from 'fs'

const projectRoot = process.cwd()
const dbPath = path.join(projectRoot, 'data', 'inoxya_bijoux.db')
const isDryRun = !process.argv.includes('--execute')

// Produits de démonstration identifiés (noms exacts)
const demoProductNames = [
  'Bague Berbère Or 18K',
  'Bague Solitaire Premium',
  'Bague Vintage Art Deco',
  'Bague Alliance Diamantee',
  'Collier Filigrane Argent',
  'Collier Pendentif Lune',
  'Bracelet Khomsa Protection',
  'Inxoya Test', // Produit de test
]

// Patterns pour identifier les produits demo (à éviter)
const demoPatterns = [
  /^test/i,
  /^demo/i,
  /^sample/i,
  /^exemple/i,
  /produit.*test/i,
]

async function main() {
  console.log('🔍 Nettoyage sécurisé des produits de démonstration\n')
  console.log('='.repeat(60) + '\n')

  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN (aucune modification)\n')
    console.log('   Pour exécuter: npx tsx scripts/cleanup-demo-products-safe.ts --execute\n')
  } else {
    console.log('🚨 MODE EXÉCUTION - Suppression définitive des produits demo\n')
  }

  // Vérifier si better-sqlite3 est disponible
  let Database: any = null
  try {
    Database = require('better-sqlite3')
    // Tester si les bindings sont disponibles
    if (Database) {
      try {
        const testDb = new Database(':memory:')
        testDb.close()
      } catch {
        Database = null
      }
    }
  } catch {
    Database = null
  }

  if (!Database) {
    console.log('⚠️  better-sqlite3 non disponible (bindings manquants)\n')
    console.log('💡 Les produits demo dans la base ne peuvent pas être supprimés maintenant\n')
    console.log('✅ Les vraies photos dans public/images/ sont préservées\n')
    console.log('✅ Le fallback utilisera uniquement les vraies photos (pas de produits demo)\n')
    console.log('💡 Pour compiler better-sqlite3, voir: docs/SETUP_BETTER_SQLITE3.md\n')
    return
  }

  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  Base de données non trouvée - Le fallback utilisera uniquement les vraies photos\n')
    return
  }

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  try {
    // Trouver les produits demo
    console.log('📋 Recherche des produits de démonstration...\n')
    
    const allProducts = db.prepare('SELECT id, name, category, image_url, is_active FROM products').all() as Array<{
      id: number
      name: string
      category: string | null
      image_url: string | null
      is_active: number
    }>

    const demoProducts = allProducts.filter(p => {
      // Vérifier si le nom correspond exactement
      if (demoProductNames.includes(p.name)) {
        return true
      }
      
      // Vérifier les patterns
      return demoPatterns.some(pattern => pattern.test(p.name))
    })

    if (demoProducts.length === 0) {
      console.log('✅ Aucun produit de démonstration trouvé dans la base de données.\n')
      console.log('✅ Les vraies photos dans public/images/ sont préservées.\n')
      db.close()
      return
    }

    console.log(`📊 ${demoProducts.length} produit(s) de démonstration trouvé(s):\n`)
    console.log('ID  | Nom                              | Catégorie        | Image')
    console.log('-'.repeat(80))
    
    demoProducts.forEach(p => {
      const name = p.name.padEnd(30)
      const category = (p.category || 'N/A').padEnd(15)
      const image = p.image_url ? '✅' : '❌'
      console.log(`${String(p.id).padStart(3)} | ${name} | ${category} | ${image}`)
    })
    
    console.log('\n⚠️  IMPORTANT: Les fichiers images dans public/images/ NE SERONT PAS supprimés\n')
    console.log('   Seules les entrées en base de données seront supprimées.\n')

    if (isDryRun) {
      console.log('✅ DRY-RUN terminé. Aucune modification effectuée.\n')
      db.close()
      return
    }

    // Créer un backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupPath = path.join(projectRoot, 'data', `inoxya_bijoux.backup.${timestamp}.db`)
    fs.copyFileSync(dbPath, backupPath)
    console.log(`💾 Backup créé: ${backupPath}\n`)

    // Supprimer les produits demo
    console.log('🗑️  Suppression des produits de démonstration...\n')
    
    const productIds = demoProducts.map(p => p.id)
    const placeholders = productIds.map(() => '?').join(',')

    // Supprimer les références
    db.prepare(`DELETE FROM favorites WHERE bijou_id IN (${placeholders})`).run(...productIds)
    db.prepare(`DELETE FROM cart_items WHERE bijou_id IN (${placeholders})`).run(...productIds)
    db.prepare(`DELETE FROM order_items WHERE bijou_id IN (${placeholders})`).run(...productIds)
    
    // Supprimer les produits
    const result = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...productIds)
    
    console.log(`✅ ${result.changes} produit(s) de démonstration supprimé(s)\n`)

    // Vérifier les produits restants
    const remaining = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    console.log(`📊 Produits réels restants: ${remaining.count}\n`)

    console.log('='.repeat(60))
    console.log('\n✅ Nettoyage terminé avec succès!\n')
    console.log('✅ Les vraies photos dans public/images/ sont préservées\n')
    console.log(`💾 Backup disponible: ${backupPath}\n`)

  } catch (error) {
    console.error('❌ Erreur:', error)
    db.close()
    process.exit(1)
  } finally {
    db.close()
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

