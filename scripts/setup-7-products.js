/**
 * Script pour nettoyer complètement tous les produits et insérer exactement 7 produits
 * Chaque produit a 1 image principale et 2 images secondaires
 * Tous les produits sont associés à l'utilisateur ADMIN
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

console.log('🚀 Configuration des 7 produits INOXYA...\n')
console.log('='.repeat(80))

// 1. Vérifier/Créer la table users et l'admin
console.log('\n1️⃣ Vérification de la table users et de l\'utilisateur admin...')

try {
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
  
  // Vérifier si l'admin existe
  let admin = db.prepare('SELECT id FROM users WHERE phone = ? AND role = ?').get('admin_phone', 'admin')
  
  if (!admin) {
    // Créer l'admin
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
  
  // 2. Vérifier/Créer la table products avec created_by
  console.log('\n2️⃣ Vérification de la structure de la table products...')
  
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
  
  // Ajouter la colonne created_by si elle n'existe pas
  try {
    db.exec(`ALTER TABLE products ADD COLUMN created_by TEXT`)
    console.log('   ✅ Colonne created_by ajoutée')
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.warn('   ⚠️  Erreur lors de l\'ajout de la colonne created_by:', e.message)
    } else {
      console.log('   ✅ Colonne created_by existe déjà')
    }
  }
  
  // Ajouter la colonne images si elle n'existe pas
  try {
    db.exec(`ALTER TABLE products ADD COLUMN images TEXT`)
    console.log('   ✅ Colonne images ajoutée')
  } catch (e) {
    if (!e.message.includes('duplicate column')) {
      console.warn('   ⚠️  Erreur lors de l\'ajout de la colonne images:', e.message)
    } else {
      console.log('   ✅ Colonne images existe déjà')
    }
  }
  
  // 3. Supprimer tous les produits existants
  console.log('\n3️⃣ Suppression de tous les produits existants...')
  const countBefore = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`   📦 Produits avant suppression: ${countBefore.count}`)
  
  const deleteResult = db.prepare('DELETE FROM products').run()
  console.log(`   ✅ ${deleteResult.changes} produit(s) supprimé(s)`)
  
  const countAfter = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`   📦 Produits après suppression: ${countAfter.count}`)
  
  // 4. Supprimer toutes les images existantes
  console.log('\n4️⃣ Suppression des images existantes...')
  if (fs.existsSync(publicImagesDir)) {
    const files = fs.readdirSync(publicImagesDir, { withFileTypes: true })
    let deletedFiles = 0
    
    files.forEach(file => {
      const filePath = path.join(publicImagesDir, file.name)
      if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
          fs.unlinkSync(filePath)
          deletedFiles++
        }
      } else if (file.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true })
      }
    })
    
    console.log(`   ✅ ${deletedFiles} fichier(s) image supprimé(s)`)
  } else {
    console.log('   ⚠️  Dossier public/images/products n\'existe pas (sera créé)')
  }
  
  // 5. Définir les 7 produits avec leurs images
  console.log('\n5️⃣ Préparation des 7 produits...')
  
  const products = [
    {
      name: 'Luna Chic',
      original_price: 220,
      current_price: 199,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 1 2025-12-03 at 17.57.02.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 1.2 2025-12-03 at 17.57.03.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 1.3 2025-12-03 at 17.57.03.jpeg'
    },
    {
      name: 'Fleur de Lune',
      original_price: 220,
      current_price: 179,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 2 2025-12-03 at 18.00.01.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 2.2 2025-12-03 at 18.00.02.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 2.3 2025-12-03 at 18.00.02.jpeg'
    },
    {
      name: 'Panthére Royale',
      original_price: 280,
      current_price: 220,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 3 2025-12-03 at 18.01.42.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 3.2 2025-12-03 at 18.01.43.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 3.3 2025-12-03 at 18.01.43.jpeg'
    },
    {
      name: 'Soleil d\'Or',
      original_price: 220,
      current_price: 179,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 4 2025-12-03 at 17.55.50.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 4.2 2025-12-03 at 17.55.50.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 4.3 2025-12-03 at 17.55.49.jpeg'
    },
    {
      name: 'Douce Harmonie',
      original_price: 230,
      current_price: 189,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 5 2025-12-03 at 17.53.43.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 5.2 2025-12-03 at 17.53.43.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 5.3 2025-12-03 at 17.53.41.jpeg'
    },
    {
      name: 'Luxoria',
      original_price: 220,
      current_price: 189,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 6 2025-12-03 at 17.52.28.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 6.2 2025-12-03 at 17.52.31.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 6.3 2025-12-03 at 17.52.31.jpeg'
    },
    {
      name: 'Radko Traditionnel',
      original_price: 230,
      current_price: 179,
      main_image: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 7 2025-12-03 at 17.48.26.jpeg',
      secondary_image_1: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 7.2 2025-12-03 at 17.48.27.jpeg',
      secondary_image_2: 'C:\\Users\\hassa\\Desktop\\image inoxya\\colier 7.3 2025-12-03 at 17.48.28.jpeg'
    }
  ]
  
  // 6. Copier les images et insérer les produits
  console.log('\n6️⃣ Copie des images et insertion des produits...')
  
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, original_price, category, stock, is_active,
      image_url, images, created_by, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  let successCount = 0
  let errorCount = 0
  
  products.forEach((product, index) => {
    try {
      console.log(`\n   📦 Produit ${index + 1}/7: ${product.name}`)
      
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
      
      // Copier les images
      if (fs.existsSync(product.main_image)) {
        fs.copyFileSync(product.main_image, mainImagePath)
        console.log(`      ✅ Image principale copiée: ${mainImageName}`)
      } else {
        console.warn(`      ⚠️  Image principale non trouvée: ${product.main_image}`)
      }
      
      if (fs.existsSync(product.secondary_image_1)) {
        fs.copyFileSync(product.secondary_image_1, secondaryImage1Path)
        console.log(`      ✅ Image secondaire 1 copiée: ${secondaryImage1Name}`)
      } else {
        console.warn(`      ⚠️  Image secondaire 1 non trouvée: ${product.secondary_image_1}`)
      }
      
      if (fs.existsSync(product.secondary_image_2)) {
        fs.copyFileSync(product.secondary_image_2, secondaryImage2Path)
        console.log(`      ✅ Image secondaire 2 copiée: ${secondaryImage2Name}`)
      } else {
        console.warn(`      ⚠️  Image secondaire 2 non trouvée: ${product.secondary_image_2}`)
      }
      
      // Préparer les chemins relatifs pour la base de données
      const mainImageUrl = `/images/products/${mainImageName}`
      const secondaryImage1Url = `/images/products/${secondaryImage1Name}`
      const secondaryImage2Url = `/images/products/${secondaryImage2Name}`
      
      // Créer le tableau d'images secondaires
      const secondaryImages = [secondaryImage1Url, secondaryImage2Url]
      
      // Insérer le produit
      const now = new Date().toISOString()
      insertProduct.run(
        product.name,
        `Collier élégant ${product.name}`,
        product.current_price,
        product.original_price,
        'Colliers',
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
  
  // 7. Vérification finale
  console.log('\n7️⃣ Vérification finale...')
  const finalCount = db.prepare('SELECT COUNT(*) as count FROM products').get()
  console.log(`   📦 Produits dans la base: ${finalCount.count}`)
  console.log(`   ✅ Produits insérés avec succès: ${successCount}`)
  if (errorCount > 0) {
    console.log(`   ❌ Produits en erreur: ${errorCount}`)
  }
  
  // Vérifier que tous les produits ont un created_by
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
  if (finalCount.count === 7 && successCount === 7) {
    console.log('\n✅ Configuration réussie!')
    console.log('   - 7 produits exactement en base de données')
    console.log('   - Chaque produit a 1 image principale et 2 images secondaires')
    console.log('   - Tous les produits sont associés à l\'utilisateur ADMIN')
    console.log('   - Les permissions admin sont activées pour créer/modifier/supprimer')
  } else {
    console.log('\n⚠️  Configuration partielle:')
    console.log(`   - ${finalCount.count} produit(s) en base (attendu: 7)`)
    console.log(`   - ${successCount} produit(s) inséré(s) avec succès`)
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

