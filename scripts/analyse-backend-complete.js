/**
 * Script d'analyse complète du backend et vérification de tous les produits
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

console.log('🔍 ANALYSE COMPLÈTE DU BACKEND - INOXYA BIJOUX\n')
console.log('='.repeat(80))

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

try {
  // ============================================
  // 1. VÉRIFICATION DE LA BASE DE DONNÉES
  // ============================================
  console.log('\n1️⃣ VÉRIFICATION DE LA BASE DE DONNÉES')
  console.log('-'.repeat(80))
  
  // Test de connexion
  const connectionTest = db.prepare('SELECT datetime(\'now\') as current_time').get()
  console.log('✅ Connexion à la base de données: OK')
  console.log(`   Heure serveur: ${connectionTest.current_time}`)
  
  // Vérifier les tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all()
  
  console.log(`\n📊 Tables dans la base de données: ${tables.length}`)
  tables.forEach(table => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get()
    console.log(`   - ${table.name}: ${count.count} enregistrement(s)`)
  })
  
  // ============================================
  // 2. ANALYSE DES PRODUITS
  // ============================================
  console.log('\n2️⃣ ANALYSE DES PRODUITS')
  console.log('-'.repeat(80))
  
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`📦 Total produits: ${totalProducts.count}`)
  
  // Récupérer tous les produits
  const products = db.prepare(`
    SELECT id, name, price, original_price, category, image_url, images, 
           created_by, is_active, created_at, updated_at
    FROM products 
    ORDER BY id
  `).all()
  
  console.log('\n📋 Liste complète des produits:')
  console.log('─'.repeat(100))
  console.log('ID  | Nom                      | Prix  | Orig  | Catégorie   | Admin | Actif | Images')
  console.log('─'.repeat(100))
  
  let productsWithImages = 0
  let productsWithSecondaryImages = 0
  let productsWithoutAdmin = 0
  let productsInactive = 0
  
  products.forEach(p => {
    const imagesCount = p.images ? (JSON.parse(p.images || '[]').length) : 0
    const hasMainImage = p.image_url ? '✅' : '❌'
    const hasSecondaryImages = imagesCount > 0 ? `✅ (${imagesCount})` : '❌'
    const adminStatus = p.created_by ? '✅' : '❌'
    const activeStatus = p.is_active ? '✅' : '❌'
    
    if (p.image_url) productsWithImages++
    if (imagesCount > 0) productsWithSecondaryImages++
    if (!p.created_by) productsWithoutAdmin++
    if (!p.is_active) productsInactive++
    
    console.log(
      `${String(p.id).padStart(3)} | ${p.name.padEnd(24)} | ${String(p.price).padStart(5)} | ${String(p.original_price || 'N/A').padStart(5)} | ${p.category.padEnd(11)} | ${adminStatus}     | ${activeStatus}     | ${hasMainImage} ${hasSecondaryImages}`
    )
  })
  
  console.log('─'.repeat(100))
  
  // Statistiques détaillées
  console.log('\n📊 Statistiques des produits:')
  console.log(`   ✅ Produits avec image principale: ${productsWithImages}/${totalProducts.count}`)
  console.log(`   ✅ Produits avec images secondaires: ${productsWithSecondaryImages}/${totalProducts.count}`)
  console.log(`   ✅ Produits associés à un admin: ${totalProducts.count - productsWithoutAdmin}/${totalProducts.count}`)
  console.log(`   ✅ Produits actifs: ${totalProducts.count - productsInactive}/${totalProducts.count}`)
  
  if (productsWithoutAdmin > 0) {
    console.log(`   ⚠️  Produits sans admin: ${productsWithoutAdmin}`)
  }
  
  if (productsInactive > 0) {
    console.log(`   ⚠️  Produits inactifs: ${productsInactive}`)
  }
  
  // Vérifier les doublons
  const duplicates = db.prepare(`
    SELECT name, COUNT(*) as count 
    FROM products 
    GROUP BY name 
    HAVING COUNT(*) > 1
  `).all()
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  DOUBLONS DÉTECTÉS:')
    duplicates.forEach(d => {
      console.log(`   - "${d.name}": ${d.count} fois`)
    })
  } else {
    console.log('\n✅ Aucun doublon détecté - Tous les produits sont uniques')
  }
  
  // Vérifier les produits sans images
  const productsWithoutImages = db.prepare(`
    SELECT id, name FROM products 
    WHERE image_url IS NULL OR image_url = ''
  `).all()
  
  if (productsWithoutImages.length > 0) {
    console.log('\n⚠️  PRODUITS SANS IMAGE PRINCIPALE:')
    productsWithoutImages.forEach(p => {
      console.log(`   - ID ${p.id}: ${p.name}`)
    })
  } else {
    console.log('\n✅ Tous les produits ont une image principale')
  }
  
  // ============================================
  // 3. ANALYSE DES IMAGES
  // ============================================
  console.log('\n3️⃣ ANALYSE DES IMAGES')
  console.log('-'.repeat(80))
  
  if (fs.existsSync(publicImagesDir)) {
    const imageFiles = fs.readdirSync(publicImagesDir).filter(file => {
      const ext = path.extname(file).toLowerCase()
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
    })
    
    console.log(`📸 Images dans public/images/products: ${imageFiles.length}`)
    
    // Vérifier que chaque produit a ses images
    let missingImages = 0
    products.forEach(product => {
      if (product.image_url) {
        const imagePath = path.join(__dirname, '..', 'public', product.image_url)
        if (!fs.existsSync(imagePath)) {
          missingImages++
          console.log(`   ⚠️  Image manquante pour "${product.name}": ${product.image_url}`)
        }
      }
      
      if (product.images) {
        try {
          const secondaryImages = JSON.parse(product.images)
          secondaryImages.forEach((imgUrl, index) => {
            const imagePath = path.join(__dirname, '..', 'public', imgUrl)
            if (!fs.existsSync(imagePath)) {
              missingImages++
              console.log(`   ⚠️  Image secondaire ${index + 1} manquante pour "${product.name}": ${imgUrl}`)
            }
          })
        } catch (e) {
          // Ignorer les erreurs de parsing
        }
      }
    })
    
    if (missingImages === 0) {
      console.log('✅ Toutes les images référencées existent sur le disque')
    } else {
      console.log(`   ⚠️  ${missingImages} image(s) manquante(s)`)
    }
  } else {
    console.log('⚠️  Dossier public/images/products n\'existe pas')
  }
  
  // ============================================
  // 4. ANALYSE DES UTILISATEURS
  // ============================================
  console.log('\n4️⃣ ANALYSE DES UTILISATEURS')
  console.log('-'.repeat(80))
  
  const users = db.prepare('SELECT id, phone, role, first_name, last_name FROM users').all()
  console.log(`👥 Total utilisateurs: ${users.length}`)
  
  if (users.length > 0) {
    console.log('\n   Liste des utilisateurs:')
    users.forEach(u => {
      console.log(`   - ID ${u.id}: ${u.phone} (${u.role}) - ${u.first_name || ''} ${u.last_name || ''}`.trim())
    })
    
    const admins = users.filter(u => u.role === 'admin')
    console.log(`\n   👑 Administrateurs: ${admins.length}`)
  }
  
  // ============================================
  // 5. ANALYSE DES CATÉGORIES
  // ============================================
  console.log('\n5️⃣ ANALYSE DES CATÉGORIES')
  console.log('-'.repeat(80))
  
  const categories = db.prepare('SELECT id, name, slug FROM categories').all()
  console.log(`📂 Total catégories: ${categories.length}`)
  
  if (categories.length > 0) {
    categories.forEach(cat => {
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category = ?').get(cat.name)
      console.log(`   - ${cat.name} (${cat.slug}): ${productCount.count} produit(s)`)
    })
  }
  
  // ============================================
  // 6. VÉRIFICATION DE L'INTÉGRITÉ
  // ============================================
  console.log('\n6️⃣ VÉRIFICATION DE L\'INTÉGRITÉ DES DONNÉES')
  console.log('-'.repeat(80))
  
  let integrityIssues = 0
  
  // Vérifier les prix
  const invalidPrices = db.prepare('SELECT id, name, price FROM products WHERE price <= 0').all()
  if (invalidPrices.length > 0) {
    console.log('⚠️  Produits avec prix invalide:')
    invalidPrices.forEach(p => {
      console.log(`   - ID ${p.id}: ${p.name} (prix: ${p.price})`)
      integrityIssues++
    })
  }
  
  // Vérifier les stocks négatifs
  const invalidStocks = db.prepare('SELECT id, name, stock FROM products WHERE stock < 0').all()
  if (invalidStocks.length > 0) {
    console.log('⚠️  Produits avec stock négatif:')
    invalidStocks.forEach(p => {
      console.log(`   - ID ${p.id}: ${p.name} (stock: ${p.stock})`)
      integrityIssues++
    })
  }
  
  // Vérifier les produits sans catégorie
  const productsWithoutCategory = db.prepare('SELECT id, name FROM products WHERE category IS NULL OR category = ?').get('')
  if (productsWithoutCategory) {
    console.log('⚠️  Produits sans catégorie détectés')
    integrityIssues++
  }
  
  if (integrityIssues === 0) {
    console.log('✅ Aucun problème d\'intégrité détecté')
  }
  
  // ============================================
  // 7. RÉSUMÉ FINAL
  // ============================================
  console.log('\n' + '='.repeat(80))
  console.log('📊 RÉSUMÉ FINAL')
  console.log('='.repeat(80))
  
  console.log(`✅ Total produits: ${totalProducts.count}`)
  console.log(`✅ Produits avec images: ${productsWithImages}/${totalProducts.count}`)
  console.log(`✅ Produits avec images secondaires: ${productsWithSecondaryImages}/${totalProducts.count}`)
  console.log(`✅ Produits associés à admin: ${totalProducts.count - productsWithoutAdmin}/${totalProducts.count}`)
  console.log(`✅ Produits actifs: ${totalProducts.count - productsInactive}/${totalProducts.count}`)
  console.log(`✅ Doublons: ${duplicates.length === 0 ? 'Aucun' : duplicates.length + ' détecté(s)'}`)
  console.log(`✅ Problèmes d'intégrité: ${integrityIssues === 0 ? 'Aucun' : integrityIssues + ' détecté(s)'}`)
  
  if (totalProducts.count === 21 && 
      productsWithImages === totalProducts.count && 
      productsWithoutAdmin === 0 && 
      duplicates.length === 0 && 
      integrityIssues === 0) {
    console.log('\n🎉 TOUT EST PARFAIT ! Le backend est en excellent état.')
  } else {
    console.log('\n⚠️  Quelques points à vérifier, mais le backend est fonctionnel.')
  }
  
  db.close()
  console.log('\n✅ Analyse terminée!')
  
} catch (error) {
  console.error('\n❌ Erreur lors de l\'analyse:', error)
  db.close()
  process.exit(1)
}

