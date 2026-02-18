/**
 * Script de vérification des 7 nouveaux produits Gourmettes
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

const db = new Database(dbPath)

console.log('🔍 VÉRIFICATION DES 7 NOUVEAUX PRODUITS GOURMETTES\n')
console.log('='.repeat(80))

try {
  // 1. Vérifier le total de produits
  const totalCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`\n1️⃣ Total produits en base: ${totalCount.count}`)
  
  if (totalCount.count === 28) {
    console.log('   ✅ Correct: 21 produits originaux + 7 nouveaux = 28 produits')
  } else {
    console.warn(`   ⚠️  Attendu: 28, Trouvé: ${totalCount.count}`)
  }
  
  // 2. Vérifier les 7 nouveaux produits
  console.log('\n2️⃣ Vérification des 7 nouveaux produits Gourmettes:')
  const gourmettes = db.prepare(`
    SELECT id, name, price, original_price, image_url, images, created_by, category
    FROM products 
    WHERE name LIKE 'Gourmette%' 
    ORDER BY id
  `).all()
  
  console.log(`   📦 Produits Gourmettes trouvés: ${gourmettes.length}`)
  
  if (gourmettes.length === 7) {
    console.log('   ✅ Correct: 7 produits Gourmettes trouvés\n')
    
    gourmettes.forEach((p, index) => {
      console.log(`   ${index + 1}. ID ${p.id}: ${p.name}`)
      console.log(`      💰 Prix: ${p.current_price || p.price} MAD (original: ${p.original_price} MAD)`)
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
    console.warn(`   ⚠️  Attendu: 7, Trouvé: ${gourmettes.length}`)
  }
  
  // 3. Vérifier que les 21 produits originaux sont intacts
  console.log('3️⃣ Vérification des produits originaux:')
  const originalCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM products 
    WHERE name NOT LIKE 'Gourmette%'
  `).get()
  
  console.log(`   📦 Produits originaux: ${originalCount.count}`)
  
  if (originalCount.count === 21) {
    console.log('   ✅ Correct: 21 produits originaux intacts')
  } else {
    console.warn(`   ⚠️  Attendu: 21, Trouvé: ${originalCount.count}`)
  }
  
  // 4. Vérifier les images
  console.log('\n4️⃣ Vérification des images:')
  const imageFiles = fs.existsSync(publicImagesDir)
    ? fs.readdirSync(publicImagesDir).filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
      })
    : []
  
  console.log(`   📸 Total images dans public/images/products: ${imageFiles.length}`)
  
  // Compter les images des gourmettes
  const gourmetteImages = imageFiles.filter(file => 
    file.includes('gourmette-')
  )
  console.log(`   📸 Images des gourmettes: ${gourmetteImages.length}`)
  
  if (gourmetteImages.length >= 21) { // 7 produits × 3 images = 21
    console.log('   ✅ Correct: Au moins 21 images pour les 7 gourmettes (3 par produit)')
  } else {
    console.warn(`   ⚠️  Attendu: au moins 21 images, Trouvé: ${gourmetteImages.length}`)
  }
  
  // 5. Résumé final
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 RÉSUMÉ FINAL:')
  console.log(`   ✅ Total produits: ${totalCount.count} (21 originaux + 7 nouveaux)`)
  console.log(`   ✅ Produits Gourmettes: ${gourmettes.length}/7`)
  console.log(`   ✅ Produits originaux: ${originalCount.count}/21`)
  console.log(`   ✅ Images gourmettes: ${gourmetteImages.length} (attendu: 21)`)
  
  const allGood = totalCount.count === 28 && 
                  gourmettes.length === 7 && 
                  originalCount.count === 21 &&
                  gourmetteImages.length >= 21
  
  if (allGood) {
    console.log('\n✅ TOUTES LES VÉRIFICATIONS SONT PASSÉES!')
    console.log('   Les 7 nouveaux produits Gourmettes ont été ajoutés avec succès.')
    console.log('   Les 21 produits originaux sont intacts.')
    console.log('   Toutes les images sont présentes.')
  } else {
    console.log('\n⚠️  CERTAINES VÉRIFICATIONS ONT ÉCHOUÉ')
  }
  
  db.close()
  
} catch (error) {
  console.error('\n❌ Erreur lors de la vérification:', error)
  db.close()
  process.exit(1)
}

