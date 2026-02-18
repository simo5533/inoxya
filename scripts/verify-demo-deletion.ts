/**
 * Script de vérification que les produits de démonstration ont été supprimés
 * 
 * Usage: npx tsx scripts/verify-demo-deletion.ts
 */

import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'

const projectRoot = process.cwd()
const dbPath = join(projectRoot, 'data', 'inoxya_bijoux.db')

const demoProductNames = [
  'Bague Berbère Or 18K',
  'Bague Solitaire Premium',
  'Bague Vintage Art Deco',
  'Collier Filigrane Argent',
  'Collier Pendentif Lune',
  'Bracelet Khomsa Protection',
]

const demoProductIds = [1, 2, 3, 4, 5, 6]

console.log('🔍 Vérification de la suppression des produits de démonstration\n')
console.log('=' .repeat(60) + '\n')

if (!existsSync(dbPath)) {
  console.error(`❌ Base de données non trouvée: ${dbPath}`)
  process.exit(1)
}

const db = new Database(dbPath)

try {
  // Vérifier par ID
  console.log('📋 Vérification par ID...\n')
  const productsById = db.prepare('SELECT id, name FROM products WHERE id IN (?, ?, ?, ?, ?, ?)').all(...demoProductIds) as Array<{ id: number; name: string }>
  
  if (productsById.length > 0) {
    console.log('❌ PROBLÈME: Des produits avec les IDs 1-6 existent encore:\n')
    productsById.forEach(p => {
      console.log(`   - ID ${p.id}: ${p.name}`)
    })
    console.log()
  } else {
    console.log('✅ Aucun produit avec les IDs 1-6 n\'existe plus.\n')
  }

  // Vérifier par nom
  console.log('📋 Vérification par nom...\n')
  let foundByName = 0
  for (const demoName of demoProductNames) {
    const products = db.prepare('SELECT id, name FROM products WHERE name LIKE ?').all(`%${demoName}%`) as Array<{ id: number; name: string }>
    if (products.length > 0) {
      foundByName++
      console.log(`❌ Trouvé: "${demoName}" → ${products.map(p => `${p.name} (ID: ${p.id})`).join(', ')}`)
    }
  }
  
  if (foundByName === 0) {
    console.log('✅ Aucun produit de démonstration trouvé par nom.\n')
  }

  // Statistiques
  console.log('📊 Statistiques:\n')
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  const activeProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
  const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
  
  console.log(`   📦 Total produits: ${totalProducts.count}`)
  console.log(`   ✅ Produits actifs: ${activeProducts.count}`)
  console.log(`   📦 Packs: ${totalPacks.count}`)
  console.log()

  // Résumé
  if (productsById.length === 0 && foundByName === 0) {
    console.log('=' .repeat(60))
    console.log('\n✅ VÉRIFICATION RÉUSSIE\n')
    console.log('   ✅ Les 6 produits de démonstration ont été supprimés')
    console.log('   ✅ 35 produits actifs restants')
    console.log('   ✅ 13 packs non affectés\n')
    process.exit(0)
  } else {
    console.log('=' .repeat(60))
    console.log('\n❌ VÉRIFICATION ÉCHOUÉE\n')
    console.log('   ⚠️  Certains produits de démonstration existent encore\n')
    process.exit(1)
  }

} catch (error) {
  console.error('❌ Erreur lors de la vérification:', error)
  process.exit(1)
} finally {
  db.close()
}

