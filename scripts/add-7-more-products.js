/**
 * Script pour ajouter 7 NOUVEAUX produits supplémentaires (15-21)
 * SANS modifier, supprimer ou toucher aux 14 premiers produits existants
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const publicImagesDir = path.join(__dirname, '..', 'public', 'images', 'products')

// Créer le dossier images/products s'il n'existe pas
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

console.log('🚀 Ajout de 7 nouveaux produits INOXYA (15-21)...\n')
console.log('='.repeat(80))

try {
  // 1. Vérifier qu'il y a bien 14 produits existants
  console.log('\n1️⃣ Vérification des produits existants...')
  const existingCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`   📦 Produits existants: ${existingCount.count}`)
  
  if (existingCount.count !== 14) {
    console.warn(`   ⚠️  Attention: ${existingCount.count} produits trouvés (attendu: 14)`)
    console.log('   ℹ️  Le script continuera quand même...')
  } else {
    console.log('   ✅ 14 produits existants confirmés')
  }
  
  // Afficher les produits existants
  const existingProducts = db.prepare('SELECT id, name FROM products ORDER BY id').all()
  console.log('\n   Produits existants:')
  existingProducts.forEach(p => {
    console.log(`      - ID ${p.id}: ${p.name}`)
  })
  
  // 2. Vérifier/Créer l'utilisateur admin
  console.log('\n2️⃣ Vérification de l\'utilisateur admin...')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  let admin = db.prepare('SELECT id FROM users WHERE phone = ? AND role = ?').get('admin_phone', 'admin')
  
  if (!admin) {
    const adminPasswordHash = bcrypt.hashSync('Admin123!', 10)
    const result = db.prepare(`
      INSERT INTO users (phone, password_hash, first_name, last_name, role)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin_phone', adminPasswordHash, 'Admin', 'INOXYA', 'admin')
    admin = { id: result.lastInsertRowid }
    console.log('   ✅ Utilisateur admin créé (ID: ' + admin.id + ')')
  } else {
    console.log('   ✅ Utilisateur admin trouvé (ID: ' + admin.id + ')')
  }
  
  const adminId = admin.id.toString()
  
  // 3. Vérifier la structure de la table products
  console.log('\n3️⃣ Vérification de la structure de la table products...')
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ar TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      category TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      image_url TEXT,
      images TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Ajouter les colonnes si elles n'existent pas
  try {
    db.exec(`ALTER TABLE products ADD COLUMN created_by TEXT`)
    console.log('   ✅ Colonne created_by vérifiée')
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.warn('   ⚠️  Erreur lors de l\'ajout de la colonne created_by:', e.message)
    }
  }
  
  try {
    db.exec(`ALTER TABLE products ADD COLUMN images TEXT`)
    console.log('   ✅ Colonne images vérifiée')
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.warn('   ⚠️  Erreur lors de l\'ajout de la colonne images:', e.message)
    }
  }
  
  // 4. Définir les 7 nouveaux produits (15-21)
  console.log('\n4️⃣ Préparation des 7 nouveaux produits (15-21)...')
  
  const newProducts = [
    {
      name: 'Prestige Traditionnel',
      original_price: 220,
      current_price: 109,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 1 2025-12-03 at 17.39.33.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 1.2 2025-12-03 at 17.39.34.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 1.3 2025-12-03 at 17.39.35.jpeg'
    },
    {
      name: 'Lumine',
      original_price: 220,
      current_price: 109,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 2 2025-12-03 at 17.38.44.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 2.2 2025-12-03 at 17.38.45.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 2.3 2025-12-03 at 17.38.46.jpeg'
    },
    {
      name: 'Nova',
      original_price: 120,
      current_price: 89,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 3 2025-12-03 at 17.38.14.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 3.2 2025-12-03 at 17.38.16.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 3.3 2025-12-03 at 17.38.16.jpeg'
    },
    {
      name: 'Royal',
      original_price: 189,
      current_price: 99,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 4 2025-12-03 at 17.37.38.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 4.2 2025-12-03 at 17.37.39.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 4.3 2025-12-03 at 17.37.40.jpeg'
    },
    {
      name: 'Élysée',
      original_price: 189,
      current_price: 99,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 5 2025-12-03 at 17.37.12.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 5.2 2025-12-03 at 17.37.13.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 5.3 2025-12-03 at 17.37.14.jpeg'
    },
    {
      name: 'Aura',
      original_price: 220,
      current_price: 139,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 6 2025-12-03 at 17.36.28.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 6.2 2025-12-03 at 17.36.30.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 6.3 2025-12-03 at 17.36.30.jpeg'
    },
    {
      name: 'Trio Lunéa',
      original_price: 220,
      current_price: 139,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 7 2025-12-03 at 17.35.45.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 7.2 2025-12-03 at 17.35.45.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\braceler 7.3 2025-12-03 at 17.35.43.jpeg'
    }
  ]
  
  // 5. Copier les images et insérer les nouveaux produits
  console.log('\n5️⃣ Copie des images et insertion des nouveaux produits...')
  
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, original_price, category, stock, is_active,
      image_url, images, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  let successCount = 0
  let errorCount = 0
  
  newProducts.forEach((product, index) => {
    try {
      console.log(`\n   📦 Nouveau produit ${index + 1}/7: ${product.name}`)
      
      // Générer des noms de fichiers uniques
      const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      const mainImageName = `${slug}-main${path.extname(product.main_image)}`
      const secondaryImage1Name = `${slug}-secondary-1${path.extname(product.secondary_image_1)}`
      const secondaryImage2Name = `${slug}-secondary-2${path.extname(product.secondary_image_2)}`
      
      const mainImagePath = path.join(publicImagesDir, mainImageName)
      const secondaryImage1Path = path.join(publicImagesDir, secondaryImage1Name)
      const secondaryImage2Path = path.join(publicImagesDir, secondaryImage2Name)
      
      // Vérifier si les images existent déjà (pour éviter les doublons)
      let imageExists = false
      if (fs.existsSync(mainImagePath)) {
        console.warn(`      ⚠️  Image principale existe déjà: ${mainImageName}`)
        imageExists = true
      }
      
      // Copier les images
      if (fs.existsSync(product.main_image)) {
        if (!imageExists) {
          fs.copyFileSync(product.main_image, mainImagePath)
          console.log(`      ✅ Image principale copiée: ${mainImageName}`)
        }
      } else {
        console.warn(`      ⚠️  Image principale non trouvée: ${product.main_image}`)
      }
      
      if (fs.existsSync(product.secondary_image_1)) {
        if (!fs.existsSync(secondaryImage1Path)) {
          fs.copyFileSync(product.secondary_image_1, secondaryImage1Path)
          console.log(`      ✅ Image secondaire 1 copiée: ${secondaryImage1Name}`)
        }
      } else {
        console.warn(`      ⚠️  Image secondaire 1 non trouvée: ${product.secondary_image_1}`)
      }
      
      if (fs.existsSync(product.secondary_image_2)) {
        if (!fs.existsSync(secondaryImage2Path)) {
          fs.copyFileSync(product.secondary_image_2, secondaryImage2Path)
          console.log(`      ✅ Image secondaire 2 copiée: ${secondaryImage2Name}`)
        }
      } else {
        console.warn(`      ⚠️  Image secondaire 2 non trouvée: ${product.secondary_image_2}`)
      }
      
      // Préparer les chemins relatifs pour la base de données
      const mainImageUrl = `/images/products/${mainImageName}`
      const secondaryImage1Url = `/images/products/${secondaryImage1Name}`
      const secondaryImage2Url = `/images/products/${secondaryImage2Name}`
      
      // Créer le tableau d'images secondaires
      const secondaryImages = [secondaryImage1Url, secondaryImage2Url]
      
      // Vérifier si le produit existe déjà (par nom)
      const existingProduct = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name)
      if (existingProduct) {
        console.warn(`      ⚠️  Produit "${product.name}" existe déjà (ID: ${existingProduct.id}) - Ignoré`)
        return
      }
      
      // Insérer le produit
      const now = new Date().toISOString()
      insertProduct.run(
        product.name,
        `Bracelet élégant ${product.name}`,
        product.current_price,
        product.original_price,
        'Bracelets',
        10, // stock par défaut
        1, // is_active
        mainImageUrl,
        JSON.stringify(secondaryImages),
        adminId,
        now,
        now
      )
      
      console.log(`      ✅ Produit inséré avec succès`)
      successCount++
    } catch (error) {
      console.error(`      ❌ Erreur lors de l'insertion du produit ${product.name}:`, error.message)
      errorCount++
    }
  })
  
  // 6. Vérification finale
  console.log('\n6️⃣ Vérification finale...')
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`   📦 Total produits dans la base: ${finalCount.count}`)
  console.log(`   ✅ Nouveaux produits insérés avec succès: ${successCount}`)
  if (errorCount > 0) {
    console.log(`   ❌ Produits en erreur: ${errorCount}`)
  }
  
  // Afficher tous les produits
  const allProducts = db.prepare('SELECT id, name, price, created_by FROM products ORDER BY id').all()
  console.log('\n   📋 Liste complète des produits:')
  allProducts.forEach(p => {
    console.log(`      - ID ${p.id}: ${p.name} (${p.price} MAD) - Admin: ${p.created_by}`)
  })
  
  // Vérifier que tous les nouveaux produits ont un created_by
  const productsWithoutAdmin = db.prepare('SELECT COUNT(*) as count FROM products WHERE created_by IS NULL OR created_by = ?').get('')
  if (productsWithoutAdmin.count > 0) {
    console.warn(`   ⚠️  ${productsWithoutAdmin.count} produit(s) sans created_by`)
  } else {
    console.log('   ✅ Tous les produits sont associés à un admin')
  }
  
  // Vérifier les images
  const imageFiles = fs.existsSync(publicImagesDir)
    ? fs.readdirSync(publicImagesDir).filter(file => {
        const ext = path.extname(file).toLowerCase()
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)
      }).length
    : 0
  console.log(`   📸 Images dans public/images/products: ${imageFiles}`)
  
  db.close()
  
  console.log('\n' + '='.repeat(80))
  if (finalCount.count === 21 && successCount === 7) {
    console.log('\n✅ Ajout réussi!')
    console.log('   - 21 produits au total en base de données')
    console.log('   - 14 produits originaux intacts')
    console.log('   - 7 nouveaux produits ajoutés (15-21)')
    console.log('   - Chaque produit a 1 image principale et 2 images secondaires')
    console.log('   - Tous les nouveaux produits sont associés à l\'utilisateur ADMIN')
  } else {
    console.log('\n⚠️  Ajout partiel:')
    console.log(`   - ${finalCount.count} produit(s) en base (attendu: 21)`)
    console.log(`   - ${successCount} nouveau(x) produit(s) inséré(s) avec succès`)
    if (errorCount > 0) {
      console.log(`   - ${errorCount} erreur(s)`)
    }
  }
  
  console.log('\n✅ Terminé!')
  
} catch (error) {
  console.error('\n❌ Erreur fatale lors de l\'exécution du script:', error)
  db.close()
  process.exit(1)
}

