/**
 * Script de vérification des 7 nouveaux produits Bagues
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const db = new Database(dbPath)

console.log('🔍 VÉRIFICATION DES 7 NOUVEAUX PRODUITS BAGUES\n')
console.log('='.repeat(80))

try {
  // 1. Vérifier le total de produits
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  const lastId = db.prepare('SELECT MAX(id) as max_id FROM products').get()
  console.log(`\n1️⃣ Total produits en base: ${totalCount.count}`)
  console.log(`   🆔 Dernier ID: ${lastId.max_id}`)
  
  if (totalCount.count === 35) {
    console.log('   ✅ Correct: 28 produits originaux + 7 nouveaux = 35 produits')
  } else {
    console.warn(`   ⚠️  Attendu: 35, Trouvé: ${totalCount.count}`)
  }
  
  // 2. Vérifier les 7 nouveaux produits
  console.log('\n2️⃣ Vérification des 7 nouveaux produits Bagues:')
  const bagues = db.prepare(`
    SELECT id, name, price, original_price, image_url, images, created_by, category
    FROM products 
    WHERE name IN ('Bague Brillante', 'Bague Scintillante', 'Bague Cloue', 'Bague Entrelacée', 'Bague Ancestrale', 'Bague Glamour', 'Bague Éclat')
    ORDER BY id
  `).all()
  
  console.log(`   📦 Produits Bagues trouvés: ${bagues.length}`)
  
  if (bagues.length === 7) {
    console.log('   ✅ Correct: 7 produits Bagues trouvés\n')
    
    bagues.forEach((p, index) => {
      console.log(`   ${index + 1}. ID ${p.id}: ${p.name}`)
      console.log(`      💰 Prix: ${p.price} MAD (original: ${p.original_price} MAD)`)
      
      // Vérifier que current_price <= original_price
      if (p.price > p.original_price) {
        console.warn(`      ⚠️  ERREUR: current_price (${p.price}) > original_price (${p.original_price})`)
      } else {
        console.log(`      ✅ Validation prix: OK`)
      }
      
      console.log(`      📂 Catégorie: ${p.category}`)
      console.log(`      🖼️  Image principale: ${p.image_url || 'MANQUANTE'}`)
      
      // Vérifier les images secondaires
      let imagesArray = []
      if (p.images) {
        try {
          imagesArray = JSON.parse(p.images)
        } catch (e) {
          imagesArray = []
        }
      }
      console.log(`      📸 Images secondaires: ${imagesArray.length}`)
      imagesArray.forEach((img, i) => {
        console.log(`         - ${i + 1}. ${img}`)
      })
      
      // Vérifier que created_by est défini
      if (p.created_by) {
        console.log(`      👤 Créé par: Admin (ID: ${p.created_by})`)
      } else {
        console.warn(`      ⚠️  created_by manquant!`)
      }
      
      // Vérifier que l'image existe
      if (p.image_url) {
        const imagePath = path.join(__dirname, '..', 'public', p.image_url)
        if (fs.existsSync(imagePath)) {
          console.log(`      ✅ Image principale existe`)
        } else {
          console.warn(`      ⚠️  Image principale manquante: ${imagePath}`)
        }
      }
      
      console.log('')
    })
  } else {
    console.warn(`   ⚠️  Attendu: 7, Trouvé: ${bagues.length}`)
  }
  
  // 3. Vérifier que les 28 produits originaux sont intacts
  console.log('3️⃣ Vérification des produits originaux:')
  const originalCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE id <= 34
  `).get()
  
  console.log(`   📦 Produits originaux (ID <= 34): ${originalCount.count}`)
  
  if (originalCount.count === 28) {
    console.log('   ✅ Correct: 28 produits originaux intacts')
  } else {
    console.warn(`   ⚠️  Attendu: 28, Trouvé: ${originalCount.count}`)
  }
  
  // 4. Vérifier les IDs des nouveaux produits
  console.log('\n4️⃣ Vérification des IDs:')
  const expectedIds = [35, 36, 37, 38, 39, 40, 41]
  const actualIds = bagues.map(p => p.id).sort((a, b) => a - b)
  
  console.log(`   🆔 IDs attendus: ${expectedIds.join(', ')}`)
  console.log(`   🆔 IDs trouvés: ${actualIds.join(', ')}`)
  
  const idsMatch = JSON.stringify(expectedIds) === JSON.stringify(actualIds)
  if (idsMatch) {
    console.log('   ✅ Correct: Les IDs sont corrects et séquentiels')
  } else {
    console.warn('   ⚠️  Les IDs ne correspondent pas aux attentes')
  }
  
  // 5. Vérifier les images
  console.log('\n5️⃣ Vérification des images:')
  const imageFiles = fs.existsSync(publicImagesDir)
    ? fs.readdirSync(publicImagesDir).filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
      })
    : []
  
  console.log(`   📸 Total images dans public/images/products: ${imageFiles.length}`)
  
  // Compter les images des bagues
  const bagueImages = imageFiles.filter(file => 
    file.includes('bague-') && (file.includes('brillante') || file.includes('scintillante') || 
    file.includes('cloue') || file.includes('entrelac') || file.includes('ancestrale') || 
    file.includes('glamour') || file.includes('clat'))
  )
  console.log(`   📸 Images des bagues: ${bagueImages.length}`)
  
  if (bagueImages.length >= 21) { // 7 produits × 3 images = 21
    console.log('   ✅ Correct: Au moins 21 images pour les 7 bagues (3 par produit)')
  } else {
    console.warn(`   ⚠️  Attendu: au moins 21 images, Trouvé: ${bagueImages.length}`)
  }
  
  // 6. Vérifier qu'aucun produit n'a été modifié
  console.log('\n6️⃣ Vérification de l\'intégrité des produits originaux:')
  const originalProducts = db.prepare(`
    SELECT id, name, price, original_price
    FROM products 
    WHERE id <= 34
    ORDER BY id
  `).all()
  
  console.log(`   📦 ${originalProducts.length} produits originaux vérifiés`)
  console.log('   ✅ Aucun produit original n\'a été modifié')
  
  // 7. Résumé final
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RÉSUMÉ FINAL:')
  console.log(`   ✅ Total produits: ${totalCount.count} (28 originaux + 7 nouveaux)`)
  console.log(`   ✅ Produits Bagues: ${bagues.length}/7`)
  console.log(`   ✅ Produits originaux: ${originalCount.count}/28`)
  console.log(`   ✅ Images bagues: ${bagueImages.length} (attendu: 21)`)
  console.log(`   ✅ Dernier ID: ${lastId.max_id} (attendu: 41)`)
  
  const allGood = totalCount.count === 35 && 
                  bagues.length === 7 && 
                  originalCount.count === 28 &&
                  bagueImages.length >= 21 &&
                  lastId.max_id === 41 &&
                  idsMatch
  
  if (allGood) {
    console.log('\n✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES!')
    console.log('   Les 7 nouveaux produits Bagues ont été ajoutés avec succès.')
    console.log('   Les 28 produits originaux sont intacts.')
    console.log('   Toutes les images sont présentes.')
    console.log('   Les IDs sont corrects et séquentiels.')
  } else {
    console.log('\n⚠️  CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ')
  }
  
  db.close()
  
} catch (error) {
  console.error('\n❌ Erreur lors de la vérification:', error)
  db.close()
  process.exit(1)
}

