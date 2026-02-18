const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const dataDir = path.join(__dirname, '..', 'data')
const publicDir = path.join(__dirname, '..', 'public')

// Créer le dossier data s'il n'existe pas
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

console.log('🌱 Seed de la base de données INOXYA BIJOUX\n')

const db = new Database(dbPath)

// Activer les foreign keys
db.pragma('foreign_keys = ON')

try {
  // Vérifier si des données existent déjà
  const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get()
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  
  if (packCount.count > 0 || productCount.count > 0) {
    console.log(`⚠️  Des données existent déjà:`)
    console.log(`   - Packs: ${packCount.count}`)
    console.log(`   - Produits: ${productCount.count}`)
    console.log(`\n💡 Pour réinitialiser, supprimez la base: data/inoxya_bijoux.db\n`)
    process.exit(0)
  }

  // 1. Insérer les catégories
  console.log('📁 Insertion des catégories...')
  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (name, slug, description, image_url) 
    VALUES (?, ?, ?, ?)
  `)

  const categories = [
    ['Bagues', 'bagues', 'Collection de bagues en acier inoxydable', '/images/categories/bagues-category.jpeg'],
    ['Colliers', 'colliers', 'Colliers élégants et durables', '/images/categories/colliers-category.jpeg'],
    ['Bracelets', 'bracelets', 'Bracelets modernes et résistants', '/images/categories/bracelets-category.jpeg'],
    ['Boucles d\'oreilles', 'boucles-oreilles', 'Boucles d\'oreilles hypoallergéniques', '/images/categories/boucles-oreilles-category.jpeg'],
    ['Parures', 'parures', 'Ensembles coordonnés de bijoux', '/images/categories/bagues-category.jpeg'],
    ['Broches', 'broches', 'Broches décoratives et élégantes', '/images/categories/broches-category.jpeg']
  ]

  categories.forEach(cat => {
    try {
      insertCategory.run(...cat)
      console.log(`   ✅ ${cat[0]}`)
    } catch (e) {
      console.log(`   ⚠️  ${cat[0]}: ${e.message}`)
    }
  })

  // 2. Insérer les packs avec vraies images
  console.log('\n📦 Insertion des packs...')
  const insertPack = db.prepare(`
    INSERT OR IGNORE INTO packs (name, slug, description, price, image_url, is_featured) 
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const packs = [
    ['Pack Élégance Berbère', 'pack-elegance-berbere', 'Collection authentique de bijoux berbères traditionnels', 1499.99, '/images/packs/pack-elegance-berbere/main.jpg', 1],
    ['Pack Moderne Chic', 'pack-moderne-chic', 'Bijoux contemporains pour un style moderne et élégant', 1299.99, '/images/packs/pack-moderne-chic/main.jpg', 1],
    ['Pack Mariée Royale', 'pack-mariee-royale', 'Ensemble complet pour votre jour de mariage', 2499.99, '/images/packs/pack-mariee-royale/main.jpg', 1],
    ['Pack Quotidien Premium', 'pack-quotidien-premium', 'Bijoux élégants pour tous les jours', 899.99, '/images/packs/pack-dore-luxe.jpg', 1],
    ['Pack Prestige', 'pack-prestige', 'Collection exclusive de bijoux haut de gamme', 1999.99, '/images/packs/pack-prestige.jpg', 1],
    ['Pack Royal', 'pack-royal', 'Bijoux royaux pour occasions spéciales', 1799.99, '/images/packs/pack-royal.jpg', 0],
    ['Pack Glamour', 'pack-glamour', 'Collection glamour pour soirées', 1599.99, '/images/packs/pack-glamour.jpg', 0],
    ['Pack Émeraude', 'pack-emeraude', 'Bijoux avec accents émeraude', 1399.99, '/images/packs/pack-emeraude.jpg', 0]
  ]

  packs.forEach(pack => {
    try {
      insertPack.run(...pack)
      console.log(`   ✅ ${pack[0]} - ${pack[3]} MAD`)
    } catch (e) {
      console.log(`   ⚠️  ${pack[0]}: ${e.message}`)
    }
  })

  // 3. Insérer les produits avec vraies images
  console.log('\n💎 Insertion des produits...')
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (name, name_ar, description, price, original_price, category, stock, is_active, image_url, images, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date().toISOString()
  
  const products = [
    // Bagues
    [
      'Bague Berbère Or 18K',
      'خاتم بربري ذهبي',
      'Magnifique bague berbère en or 18 carats avec motifs traditionnels marocains authentiques. Pièce unique artisanale.',
      2999.00,
      3999.00,
      'Bagues',
      5,
      1,
      '/images/bijoux/bagues/bague-berbere-or-18k/main.jpg',
      JSON.stringify(['/images/bijoux/bagues/bague-berbere-or-18k/gallery-1.jpg', '/images/bijoux/bagues/bague-berbere-or-18k/gallery-2.jpg', '/images/bijoux/bagues/bague-berbere-or-18k/gallery-3.jpg']),
      now,
      now
    ],
    [
      'Bague Solitaire Premium',
      'خاتم ماسي',
      'Bague solitaire avec diamant central, monture en or blanc. Élégance intemporelle.',
      4999.00,
      null,
      'Bagues',
      3,
      1,
      '/images/bijoux/bagues/bague-solitaire-premium/main.jpg',
      JSON.stringify(['/images/bijoux/bagues/bague-solitaire-premium/gallery-1.jpg', '/images/bijoux/bagues/bague-solitaire-premium/gallery-2.jpg', '/images/bijoux/bagues/bague-solitaire-premium/gallery-3.jpg']),
      now,
      now
    ],
    [
      'Bague Vintage Art Deco',
      'خاتم كلاسيكي',
      'Bague vintage style Art Déco avec motifs géométriques. Pièce de collection.',
      1899.00,
      2499.00,
      'Bagues',
      7,
      1,
      '/images/bijoux/bagues/bague-vintage-art-deco/main.jpg',
      JSON.stringify([]),
      now,
      now
    ],
    // Colliers
    [
      'Collier Filigrane Argent',
      'قلادة فضية مزركشة',
      'Collier en argent sterling avec technique de filigrane traditionnel marocain. Longueur ajustable.',
      1890.00,
      null,
      'Colliers',
      8,
      1,
      '/images/bijoux/colliers/collier-filigrane-argent/main.jpg',
      JSON.stringify(['/images/bijoux/colliers/collier-filigrane-argent/gallery-1.jpg', '/images/bijoux/colliers/collier-filigrane-argent/gallery-2.jpg']),
      now,
      now
    ],
    [
      'Collier Pendentif Lune',
      'قلادة قمرية',
      'Collier avec pendentif en forme de lune. Symbolisme et élégance.',
      1299.00,
      1599.00,
      'Colliers',
      6,
      1,
      '/images/bijoux/colliers/collier-pendentif-lune/main.jpg',
      JSON.stringify([]),
      now,
      now
    ],
    // Bracelets
    [
      'Bracelet Khomsa Protection',
      'سوار خميسة الحماية',
      'Bracelet en argent avec symbole de la main de Fatma (Khomsa) pour la protection. Traditionnel et protecteur.',
      890.00,
      1100.00,
      'Bracelets',
      12,
      1,
      '/images/bijoux/bracelets/bracelet-khomsa-protection/main.jpg',
      JSON.stringify(['/images/bijoux/bracelets/bracelet-khomsa-protection/gallery-1.jpg', '/images/bijoux/bracelets/bracelet-khomsa-protection/gallery-2.jpg']),
      now,
      now
    ],
    [
      'Bracelet Chaîne Gourmette',
      'سوار سلسلة',
      'Bracelet chaîne gourmette en acier inoxydable. Style moderne et résistant.',
      450.00,
      null,
      'Bracelets',
      15,
      1,
      '/images/bijoux/bracelets/bracelet-chaine-gourmette/main.jpg',
      JSON.stringify([]),
      now,
      now
    ],
    // Boucles d'oreilles
    [
      'Boucles d\'oreilles Créoles Berbères',
      'أقراط كريول بربرية',
      'Boucles d\'oreilles créoles avec motifs berbères traditionnels. Taille moyenne.',
      650.00,
      850.00,
      'Boucles d\'oreilles',
      10,
      1,
      '/images/bijoux/boucles-oreilles/boucles-creoles-berberes/main.jpg',
      JSON.stringify([]),
      now,
      now
    ],
    [
      'Boucles d\'oreilles Étoiles Dorées',
      'أقراط نجوم ذهبية',
      'Boucles d\'oreilles avec motifs d\'étoiles dorées. Style élégant et raffiné.',
      750.00,
      null,
      'Boucles d\'oreilles',
      8,
      1,
      '/images/bijoux/boucles-oreilles/boucles-etoiles-dorees/main.jpg',
      JSON.stringify([]),
      now,
      now
    ]
  ]

  products.forEach(product => {
    try {
      insertProduct.run(...product)
      console.log(`   ✅ ${product[0]} - ${product[3]} MAD`)
    } catch (e) {
      console.log(`   ⚠️  ${product[0]}: ${e.message}`)
    }
  })

  // 4. Créer un utilisateur admin par défaut
  console.log('\n👤 Création utilisateur admin...')
  try {
    const adminExists = db.prepare('SELECT id FROM users WHERE phone = ?').get('admin')
    if (!adminExists) {
      const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
      db.prepare(`
        INSERT INTO users (phone, password_hash, first_name, last_name, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
      console.log('   ✅ Utilisateur admin créé (phone: admin, password: Admin123!)')
    } else {
      console.log('   ⚠️  Utilisateur admin existe déjà')
    }
  } catch (e) {
    console.log(`   ⚠️  Erreur création admin: ${e.message}`)
  }

  // Résumé
  const finalPackCount = db.prepare('SELECT COUNT(*) as count FROM packs').get()
  const finalProductCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  const finalCategoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()

  console.log('\n✅ Seed terminé avec succès!')
  console.log(`\n📊 Résumé:`)
  console.log(`   - Catégories: ${finalCategoryCount.count}`)
  console.log(`   - Packs: ${finalPackCount.count}`)
  console.log(`   - Produits: ${finalProductCount.count}`)
  console.log(`\n🚀 Vous pouvez maintenant lancer: npm run dev`)

} catch (error) {
  console.error('❌ Erreur lors du seed:', error)
  process.exit(1)
} finally {
  db.close()
}

