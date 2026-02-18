/**
 * Script pour créer des produits avec leurs propres images
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

// Chemin vers la base de données
const dbPath = path.join(__dirname, '..', 'data', 'inoxya_bijoux.db')
const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// Initialiser la base de données si nécessaire
try {
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  // Ajouter la colonne images si elle n'existe pas
  try {
    db.exec(`ALTER TABLE products ADD COLUMN images TEXT`)
  } catch (e) {
    // La colonne existe déjà, ignorer
  }
} catch (error) {
  console.error('❌ Erreur lors de l\'initialisation:', error.message)
}

// Fonction pour trouver les images disponibles sur le Desktop
function findImagesOnDesktop() {
  const desktopPath = path.join(process.env.USERPROFILE || '', 'Desktop')
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.JPEG', '.PNG', '.WEBP']
  const files = fs.readdirSync(desktopPath)
  
  return files
    .filter(file => {
      const ext = path.extname(file)
      return imageExtensions.includes(ext)
    })
    .map(file => path.join(desktopPath, file))
    .filter(filePath => fs.statSync(filePath).isFile())
}

// Produits à créer avec leurs images
const productsToCreate = [
  {
    name: "OMEGA",
    description: "Montre de luxe OMEGA avec design élégant",
    price: 199,
    category: "Montres",
    stock: 10,
    // Les images seront assignées automatiquement
  },
  {
    name: "MONTRE VR",
    description: "Montre VR moderne et stylée",
    price: 199,
    category: "Montres",
    stock: 8,
  },
  {
    name: "D&W",
    description: "Montre D&W premium",
    price: 199,
    category: "Montres",
    stock: 12,
  }
]

// Trouver toutes les images disponibles
const availableImages = findImagesOnDesktop()
console.log(`📸 Images trouvées sur le Desktop: ${availableImages.length}\n`)

if (availableImages.length === 0) {
  console.log('❌ Aucune image trouvée sur le Desktop')
  db.close()
  process.exit(1)
}

// Afficher les images trouvées
console.log('Images disponibles:')
availableImages.forEach((img, idx) => {
  console.log(`  ${idx + 1}. ${path.basename(img)}`)
})
console.log('')

// Fonction pour créer ou mettre à jour un produit
function createOrUpdateProduct(product, mainImage, secondaryImages) {
  // Vérifier si le produit existe déjà
  const existing = db.prepare('SELECT id FROM products WHERE name = ?').get(product.name)
  
  const imagesJson = JSON.stringify(secondaryImages || [])
  const isActive = 1
  
  if (existing) {
    // Mettre à jour le produit existant
    db.prepare(`
      UPDATE products 
      SET price = ?, image_url = ?, images = ?, description = ?, category = ?, stock = ?, updated_at = ?
      WHERE name = ?
    `).run(
      product.price,
      mainImage,
      imagesJson,
      product.description || null,
      product.category,
      product.stock || 0,
      new Date().toISOString(),
      product.name
    )
    console.log(`✅ Produit "${product.name}" mis à jour (ID: ${existing.id})`)
    return existing.id
  } else {
    // Insérer un nouveau produit
    const result = db.prepare(`
      INSERT INTO products (name, price, image_url, images, description, category, stock, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.name,
      product.price,
      mainImage,
      imagesJson,
      product.description || null,
      product.category,
      product.stock || 0,
      isActive,
      new Date().toISOString(),
      new Date().toISOString()
    )
    console.log(`✅ Produit "${product.name}" créé (ID: ${result.lastInsertRowid})`)
    return result.lastInsertRowid
  }
}

// Assigner les images aux produits
console.log('🚀 Création/Mise à jour des produits avec leurs images...\n')

// Pour chaque produit, assigner des images différentes
productsToCreate.forEach((product, index) => {
  // Prendre des images différentes pour chaque produit
  // Image principale : index * 2 (pour avoir des images différentes)
  // Images secondaires : les 2 suivantes
  
  const mainImageIndex = (index * 2) % availableImages.length
  const secondaryImage1Index = (mainImageIndex + 1) % availableImages.length
  const secondaryImage2Index = (mainImageIndex + 2) % availableImages.length
  
  const mainImage = availableImages[mainImageIndex]
  const secondaryImages = [
    availableImages[secondaryImage1Index],
    availableImages[secondaryImage2Index]
  ].filter(img => img !== mainImage) // Éviter les doublons
  
  console.log(`\n📦 Produit: ${product.name}`)
  console.log(`   Image principale: ${path.basename(mainImage)}`)
  console.log(`   Images secondaires:`)
  secondaryImages.forEach((img, idx) => {
    console.log(`     ${idx + 1}. ${path.basename(img)}`)
  })
  
  createOrUpdateProduct(product, mainImage, secondaryImages)
})

// Afficher tous les produits créés
console.log('\n' + '='.repeat(80))
console.log('\n📋 PRODUITS DANS LA BASE DE DONNÉES:\n')

const allProducts = db.prepare('SELECT id, name, price, image_url, images FROM products ORDER BY id').all()
allProducts.forEach((product, index) => {
  let imagesArray = []
  if (product.images) {
    try {
      imagesArray = JSON.parse(product.images)
    } catch (e) {
      imagesArray = []
    }
  }
  
  console.log(`${index + 1}. ID: ${product.id} - ${product.name}`)
  console.log(`   Prix: ${product.price} MAD`)
  console.log(`   Image principale: ${path.basename(product.image_url || 'Aucune')}`)
  console.log(`   Images secondaires: ${imagesArray.length} image(s)`)
  imagesArray.forEach((img, idx) => {
    console.log(`     ${idx + 1}. ${path.basename(img)}`)
  })
  console.log('')
})

db.close()
console.log('✅ Terminé! Tous les produits ont été créés/mis à jour avec leurs images.')

