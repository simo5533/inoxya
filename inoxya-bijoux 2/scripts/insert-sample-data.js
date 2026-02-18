const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

console.log('📦 Insertion des données d\'exemple...\n')

const db = new Database(dbPath)

try {
  // Vérifier si des données existent déjà
  const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get()
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  
  if (packCount.count > 0 || productCount.count > 0) {
    console.log(`⚠️  Des données existent déjà:`)
    console.log(`   - Packs: ${packCount.count}`)
    console.log(`   - Produits: ${productCount.count}`)
    console.log(`\n💡 Pour réinitialiser, supprimez la base de données: data/inoxya_bijoux.db\n`)
    process.exit(0)
  }

  // Insérer des catégories
  console.log('📁 Insertion des catégories...')
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, image_url) 
    VALUES (?, ?, ?, ?)
  `)

  const categories = [
    ['Bagues', 'bagues', 'Collection de bagues en acier inoxydable', '/placeholder.svg'],
    ['Colliers', 'colliers', 'Colliers élégants et durables', '/placeholder.svg'],
    ['Bracelets', 'bracelets', 'Bracelets modernes et résistants', '/placeholder.svg'],
    ['Boucles d\'oreilles', 'boucles-oreilles', 'Boucles d\'oreilles hypoallergéniques', '/placeholder.svg'],
    ['Parures', 'parures', 'Ensembles coordonnés de bijoux', '/placeholder.svg']
  ]

  categories.forEach(cat => {
    try {
      insertCategory.run(...cat)
      console.log(`   ✅ ${cat[0]}`)
    } catch (e) {
      if (e.message.includes('UNIQUE constraint')) {
        console.log(`   ⚠️  ${cat[0]} existe déjà`)
      } else {
        console.log(`   ❌ Erreur ${cat[0]}:`, e.message)
      }
    }
  })

  // Insérer des packs
  console.log('\n📦 Insertion des packs...')
  const insertPack = db.prepare(`
    INSERT INTO packs (name, slug, description, price, image_url, is_featured) 
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const packs = [
    ['Pack Mariage Premium', 'pack-mariage-premium', 'Ensemble complet pour votre jour J - Bague, collier et boucles d\'oreilles', 1499.99, '/placeholder.svg', 1],
    ['Pack Élégance', 'pack-elegance', 'Pour toutes vos occasions spéciales - Collection raffinée', 999.99, '/placeholder.svg', 1],
    ['Pack Quotidien', 'pack-quotidien', 'Bijoux pour tous les jours - Style moderne et confortable', 699.99, '/placeholder.svg', 0],
    ['Pack Cadeau', 'pack-cadeau', 'Le cadeau parfait pour vos proches - Emballage cadeau inclus', 899.99, '/placeholder.svg', 1],
    ['Pack Collection Complète', 'pack-collection-complete', 'Tous nos bijoux en un seul pack - Économisez jusqu\'à 30%', 2499.99, '/placeholder.svg', 1]
  ]

  packs.forEach(pack => {
    try {
      insertPack.run(...pack)
      console.log(`   ✅ ${pack[0]} - ${pack[3]} MAD`)
    } catch (e) {
      if (e.message.includes('UNIQUE constraint')) {
        console.log(`   ⚠️  ${pack[0]} existe déjà`)
      } else {
        console.log(`   ❌ Erreur ${pack[0]}:`, e.message)
      }
    }
  })

  // Insérer des produits
  console.log('\n💎 Insertion des produits...')
  const insertProduct = db.prepare(`
    INSERT INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const products = [
    ['Bague Berbère Or 18K', 'خاتم بربري ذهبي', 'Magnifique bague berbère en or 18 carats avec motifs traditionnels marocains.', 2999.00, 3999.00, 'Bagues', 5, 1, '/placeholder.svg', JSON.stringify(['promo', 'nouveau']), new Date().toISOString(), new Date().toISOString()],
    ['Collier Filigrane Argent', 'قلادة فضية مزركشة', 'Collier en argent sterling avec technique de filigrane traditionnel.', 1890.00, null, 'Colliers', 8, 1, '/placeholder.svg', JSON.stringify(['bestseller']), new Date().toISOString(), new Date().toISOString()],
    ['Bracelet Khomsa Protection', 'سوار خميسة الحماية', 'Bracelet en argent avec symbole de la main de Fatma pour la protection.', 890.00, 1200.00, 'Bracelets', 12, 1, '/placeholder.svg', JSON.stringify(['promo']), new Date().toISOString(), new Date().toISOString()],
    ['Boucles d\'oreilles Perles', 'أقراط اللؤلؤ', 'Élégantes boucles d\'oreilles avec perles naturelles et finitions dorées.', 1200.00, null, 'Boucles d\'oreilles', 3, 1, '/placeholder.svg', JSON.stringify(['premium']), new Date().toISOString(), new Date().toISOString()],
    ['Bague Solitaire Diamant', 'خاتم الماس', 'Bague solitaire avec diamant central et bande en or blanc.', 4999.00, 5999.00, 'Bagues', 2, 1, '/placeholder.svg', JSON.stringify(['promo', 'premium']), new Date().toISOString(), new Date().toISOString()],
    ['Collier Perles de Culture', 'قلادة اللؤلؤ', 'Collier de perles de culture avec fermoir en or.', 2500.00, null, 'Colliers', 6, 1, '/placeholder.svg', JSON.stringify(['nouveau']), new Date().toISOString(), new Date().toISOString()],
    ['Bracelet Chaîne Or Jaune', 'سوار ذهبي', 'Bracelet chaîne en or jaune 18 carats, ajustable.', 3500.00, 4200.00, 'Bracelets', 4, 1, '/placeholder.svg', JSON.stringify(['promo']), new Date().toISOString(), new Date().toISOString()],
    ['Boucles d\'oreilles Pampilles', 'أقراط متدلية', 'Boucles d\'oreilles pampilles en or avec pierres précieuses.', 1800.00, null, 'Boucles d\'oreilles', 7, 1, '/placeholder.svg', JSON.stringify(['bestseller']), new Date().toISOString(), new Date().toISOString()],
    ['Bague Alliance Or Blanc', 'خاتم الزواج', 'Bague alliance en or blanc avec finition satinée.', 1500.00, 1800.00, 'Bagues', 10, 1, '/placeholder.svg', JSON.stringify(['promo']), new Date().toISOString(), new Date().toISOString()],
    ['Collier Sautoir Perles', 'قلادة طويلة', 'Collier sautoir de perles avec longueur ajustable.', 2200.00, null, 'Colliers', 5, 1, '/placeholder.svg', JSON.stringify(['nouveau']), new Date().toISOString(), new Date().toISOString()]
  ]

  products.forEach(product => {
    try {
      insertProduct.run(...product)
      console.log(`   ✅ ${product[0]} - ${product[3]} MAD`)
    } catch (e) {
      console.log(`   ❌ Erreur ${product[0]}:`, e.message)
    }
  })

  console.log('\n✅ Données d\'exemple insérées avec succès!')
  console.log(`\n📊 Résumé:`)
  console.log(`   - Catégories: ${categories.length}`)
  console.log(`   - Packs: ${packs.length}`)
  console.log(`   - Produits: ${products.length}`)
  console.log(`\n🚀 Vous pouvez maintenant voir les packs et produits sur le site!`)

} catch (error) {
  console.error('❌ Erreur lors de l\'insertion des données:', error)
  process.exit(1)
} finally {
  db.close()
}

