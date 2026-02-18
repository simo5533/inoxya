const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)

console.log('🔍 Diagnostic du problème d\'affichage...\n')

try {
  // 1. Vérifier les packs
  console.log('📦 PACKS:')
  const packs = db.prepare('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC LIMIT 5').all()
  console.log(`   Total dans la base: ${db.prepare('SELECT COUNT(*) as count FROM packs').get().count}`)
  console.log(`   Affichage de 5 premiers:\n`)
  
  packs.forEach((pack, i) => {
    console.log(`   ${i + 1}. ${pack.name}`)
    console.log(`      ID: ${pack.id}`)
    console.log(`      Slug: ${pack.slug}`)
    console.log(`      Prix: ${pack.price} MAD`)
    console.log(`      Image: ${pack.image_url || 'Aucune'}`)
    console.log(`      Featured: ${pack.is_featured ? 'Oui' : 'Non'}`)
    console.log('')
  })

  // 2. Simuler getPacks() de sqlite.ts
  console.log('🔧 Test de getPacks() (simulation):')
  const getPacks = () => {
    if (!db) return []
    try {
      const rows = db.prepare('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC').all()
      return rows.map(r => ({ ...r, id: String(r.id), is_featured: Boolean(r.is_featured) }))
    } catch (e) {
      console.error('   ❌ Erreur:', e.message)
      return []
    }
  }
  
  const packsFromFunction = getPacks()
  console.log(`   ✅ ${packsFromFunction.length} pack(s) retourné(s)`)
  if (packsFromFunction.length > 0) {
    console.log(`   Premier pack: ${packsFromFunction[0].name}`)
  }

  // 3. Vérifier les produits
  console.log('\n💎 PRODUITS:')
  const products = db.prepare('SELECT id, name, price, image_url, is_active FROM products WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5').all()
  console.log(`   Total actifs dans la base: ${db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get().count}`)
  console.log(`   Affichage de 5 premiers:\n`)
  
  products.forEach((product, i) => {
    console.log(`   ${i + 1}. ${product.name}`)
    console.log(`      ID: ${product.id}`)
    console.log(`      Prix: ${product.price} MAD`)
    console.log(`      Image: ${product.image_url || 'Aucune'}`)
    console.log('')
  })

  // 4. Vérifier si les données sont accessibles
  console.log('✅ DIAGNOSTIC:')
  console.log(`   - Packs dans la base: ${packs.length > 0 ? '✅ Oui' : '❌ Non'}`)
  console.log(`   - Produits dans la base: ${products.length > 0 ? '✅ Oui' : '❌ Non'}`)
  console.log(`   - Fonction getPacks() fonctionne: ${packsFromFunction.length > 0 ? '✅ Oui' : '❌ Non'}`)
  
  console.log('\n💡 PROBLÈME PROBABLE:')
  if (packs.length > 0 && packsFromFunction.length > 0) {
    console.log('   ✅ Les données existent et sont accessibles')
    console.log('   ⚠️  Le problème vient probablement de:')
    console.log('      1. L\'API /api/packs ne retourne pas les données')
    console.log('      2. La page frontend ne charge pas les données')
    console.log('      3. Une erreur JavaScript dans la console')
    console.log('\n   🔧 SOLUTION:')
    console.log('      1. Ouvrez http://localhost:3000/api/packs dans votre navigateur')
    console.log('      2. Vérifiez si vous voyez un JSON avec les packs')
    console.log('      3. Si vous voyez [], l\'API a un problème')
    console.log('      4. Si vous voyez des données, le problème vient du frontend')
  } else {
    console.log('   ❌ Les données ne sont pas accessibles')
    console.log('   💡 Vérifiez la connexion à la base de données')
  }

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  db.close()
}

