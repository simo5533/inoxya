const Database = require('better-sqlite3')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

console.log('🔍 Test de l\'API Packs...\n')

const db = new Database(dbPath)

try {
  // Test 1: Vérifier les packs dans la base
  console.log('1. Vérification des packs dans la base de données...')
  const packs = db.prepare('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC').all()
  console.log(`   ✅ ${packs.length} pack(s) trouvé(s) dans la base\n`)
  
  if (packs.length > 0) {
    console.log('   Premier pack:')
    console.log(`   - ID: ${packs[0].id}`)
    console.log(`   - Nom: ${packs[0].name}`)
    console.log(`   - Prix: ${packs[0].price} MAD`)
    console.log(`   - Image: ${packs[0].image_url || 'Aucune'}\n`)
  }

  // Test 2: Simuler la fonction getPacks()
  console.log('2. Test de la fonction getPacks()...')
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
  console.log(`   ✅ ${packsFromFunction.length} pack(s) retourné(s) par getPacks()\n`)

  // Test 3: Vérifier les produits
  console.log('3. Vérification des produits dans la base de données...')
  const products = db.prepare('SELECT id, name, price, image_url FROM products WHERE is_active = 1 LIMIT 5').all()
  console.log(`   ✅ ${products.length} produit(s) trouvé(s) (affichage de 5)\n`)
  
  if (products.length > 0) {
    console.log('   Premiers produits:')
    products.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} - ${p.price} MAD`)
    })
  }

  console.log('\n✅ Tests terminés!')
  console.log('\n💡 Si les packs ne s\'affichent pas sur le site:')
  console.log('   1. Vérifiez que le serveur Next.js est démarré (npm run dev)')
  console.log('   2. Ouvrez http://localhost:3000/api/packs dans votre navigateur')
  console.log('   3. Vérifiez la console du navigateur (F12) pour les erreurs')
  console.log('   4. Vérifiez l\'onglet Network pour voir si /api/packs répond')

} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  db.close()
}

