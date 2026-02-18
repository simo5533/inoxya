#!/usr/bin/env tsx
/**
 * PHASE 4: Script pour corriger les valeurs NULL dans is_active et is_featured
 * Met à jour tous les produits/packs avec is_active=NULL ou is_featured=NULL
 * pour les définir à 1 (actif) par défaut
 */

import { getDbPath } from '../lib/sqlite'

async function main() {
  console.log('🔧 PHASE 4: Correction des valeurs NULL dans is_active/is_featured\n')
  
  try {
    const Database = require('better-sqlite3')
    const dbPath = getDbPath()
    const db = new Database(dbPath)
    
    console.log(`📁 Base de données: ${dbPath}\n`)
    
    // 1. Vérifier les produits avec is_active NULL
    const productsWithNullActive = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active IS NULL').get() as { count: number }
    console.log(`📦 Produits avec is_active=NULL: ${productsWithNullActive.count}`)
    
    // 2. Corriger les produits avec is_active NULL → définir à 1
    if (productsWithNullActive.count > 0) {
      const result = db.prepare('UPDATE products SET is_active = 1 WHERE is_active IS NULL').run()
      console.log(`   ✅ ${result.changes} produit(s) mis à jour (is_active = 1)`)
    }
    
    // 3. Vérifier les produits avec is_featured NULL
    const productsWithNullFeatured = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_featured IS NULL').get() as { count: number }
    console.log(`📦 Produits avec is_featured=NULL: ${productsWithNullFeatured.count}`)
    
    // 4. Corriger les produits avec is_featured NULL → définir à 0 (pas vedette par défaut)
    if (productsWithNullFeatured.count > 0) {
      const result = db.prepare('UPDATE products SET is_featured = 0 WHERE is_featured IS NULL').run()
      console.log(`   ✅ ${result.changes} produit(s) mis à jour (is_featured = 0)`)
    }
    
    // 5. Vérifier les packs avec is_featured NULL
    const packsWithNullFeatured = db.prepare('SELECT COUNT(*) as count FROM packs WHERE is_featured IS NULL').get() as { count: number }
    console.log(`📦 Packs avec is_featured=NULL: ${packsWithNullFeatured.count}`)
    
    // 6. Corriger les packs avec is_featured NULL → définir à 0
    if (packsWithNullFeatured.count > 0) {
      const result = db.prepare('UPDATE packs SET is_featured = 0 WHERE is_featured IS NULL').run()
      console.log(`   ✅ ${result.changes} pack(s) mis à jour (is_featured = 0)`)
    }
    
    // 7. Vérification finale
    console.log('\n📊 Vérification finale:')
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
    const activeProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
    
    console.log(`   Total produits: ${totalProducts.count}`)
    console.log(`   Produits actifs (is_active=1): ${activeProducts.count}`)
    console.log(`   Total packs: ${totalPacks.count}`)
    
    db.close()
    console.log('\n✅ Correction terminée avec succès\n')
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  }
}

main().catch(console.error)

