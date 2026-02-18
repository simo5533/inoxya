const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

console.log('🔍 Test de connexion à la base de données...\n')

// Chemin vers la base de données
const dbPath1 = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dbPath2 = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

console.log('Chemins testés:')
console.log(`  1. ${dbPath1}`)
console.log(`  2. ${dbPath2}\n`)

let db = null
let dbPath = null

// Essayer le premier chemin
if (fs.existsSync(dbPath1)) {
  console.log(`✅ Base trouvée: ${dbPath1}`)
  dbPath = dbPath1
  try {
    db = new Database(dbPath1)
    console.log('✅ Connexion réussie avec chemin 1\n')
  } catch (e) {
    console.log(`❌ Erreur connexion chemin 1: ${e.message}\n`)
  }
}

// Essayer le deuxième chemin si le premier a échoué
if (!db && fs.existsSync(dbPath2)) {
  console.log(`✅ Base trouvée: ${dbPath2}`)
  dbPath = dbPath2
  try {
    db = new Database(dbPath2)
    console.log('✅ Connexion réussie avec chemin 2\n')
  } catch (e) {
    console.log(`❌ Erreur connexion chemin 2: ${e.message}\n`)
  }
}

if (!db) {
  console.log('❌ Impossible de se connecter à la base de données')
  console.log('\nVérification des chemins:')
  console.log(`  Chemin 1 existe: ${fs.existsSync(dbPath1)}`)
  console.log(`  Chemin 2 existe: ${fs.existsSync(dbPath2)}`)
  process.exit(1)
}

try {
  // Test 1: Vérifier les packs
  console.log('📦 Test des packs:')
  const packs = db.prepare('SELECT COUNT(*) as count FROM packs').get()
  console.log(`  Total packs: ${packs.count}`)
  
  if (packs.count > 0) {
    const samplePacks = db.prepare('SELECT id, name, price, image_url FROM packs LIMIT 3').all()
    console.log('  Exemples:')
    samplePacks.forEach(p => {
      console.log(`    - ${p.name} (${p.price} MAD) - Image: ${p.image_url || 'Aucune'}`)
    })
  }
  
  // Test 2: Vérifier les produits
  console.log('\n💎 Test des produits:')
  const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get()
  console.log(`  Total produits actifs: ${products.count}`)
  
  if (products.count > 0) {
    const sampleProducts = db.prepare('SELECT id, name, price, image_url FROM products WHERE is_active = 1 LIMIT 3').all()
    console.log('  Exemples:')
    sampleProducts.forEach(p => {
      console.log(`    - ${p.name} (${p.price} MAD) - Image: ${p.image_url || 'Aucune'}`)
    })
  }
  
  // Test 3: Simuler getPacks()
  console.log('\n🔧 Test de getPacks() (simulation):')
  const rows = db.prepare('SELECT id, name, slug, description, price, image_url, is_featured FROM packs ORDER BY created_at DESC').all()
  const packsFormatted = rows.map(r => ({ ...r, id: String(r.id), is_featured: Boolean(r.is_featured) }))
  console.log(`  Résultat: ${packsFormatted.length} pack(s)`)
  if (packsFormatted.length > 0) {
    console.log(`  Premier: ${packsFormatted[0].name}`)
  }
  
  console.log('\n✅ Tous les tests réussis!')
  console.log(`\n💡 Le problème vient probablement de l'API ou du frontend`)
  console.log(`   Vérifiez les logs du serveur Next.js pour voir les erreurs`)
  
} catch (error) {
  console.error('❌ Erreur:', error.message)
  console.error(error.stack)
} finally {
  if (db) db.close()
}

