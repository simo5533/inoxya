/**
 * Script pour ajouter les produits d'exemple OMEGA et MONTRE VR
 */

const Database = require('better-sqlite3')
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

// Produits à ajouter
const productsToAdd = [
  {
    id: 3,
    name: "OMEGA",
    price: 199,
    main_image: "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_8230efab.jpg",
    images: [
      "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_78f2ff3a.jpg",
      "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_7e6833fe.jpg"
    ],
    description: "Montre OMEGA de luxe",
    category: "Montres",
    stock: 10,
    is_active: true
  },
  {
    id: 4,
    name: "MONTRE VR",
    price: 199,
    main_image: "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_8230efab.jpg",
    images: [
      "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_78f2ff3a.jpg",
      "C:\\Users\\hassa\\Desktop\\WhatsApp Image 2025-12-03 à 18.10.52_8230efab.jpg"
    ],
    description: "Montre VR moderne",
    category: "Montres",
    stock: 8,
    is_active: true
  }
]

// Fonction pour insérer ou mettre à jour un produit
function insertOrUpdateProduct(product) {
  // Vérifier si le produit existe déjà
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(product.id)
  
  const imagesJson = JSON.stringify(product.images || [])
  
  // Convertir boolean en integer pour SQLite
  const isActive = product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1
  
  if (existing) {
    // Mettre à jour le produit existant
    db.prepare(`
      UPDATE products 
      SET name = ?, price = ?, image_url = ?, images = ?, description = ?, category = ?, stock = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `).run(
      product.name,
      product.price,
      product.main_image,
      imagesJson,
      product.description || null,
      product.category,
      product.stock || 0,
      isActive,
      new Date().toISOString(),
      product.id
    )
    console.log(`✅ Produit ${product.id} (${product.name}) mis à jour`)
  } else {
    // Insérer un nouveau produit
    db.prepare(`
      INSERT INTO products (id, name, price, image_url, images, description, category, stock, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      product.id,
      product.name,
      product.price,
      product.main_image,
      imagesJson,
      product.description || null,
      product.category,
      product.stock || 0,
      isActive,
      new Date().toISOString(),
      new Date().toISOString()
    )
    console.log(`✅ Produit ${product.id} (${product.name}) ajouté`)
  }
}

// Ajouter tous les produits
console.log('🚀 Ajout des produits d\'exemple...\n')

productsToAdd.forEach(product => {
  try {
    insertOrUpdateProduct(product)
  } catch (error) {
    console.error(`❌ Erreur lors de l'ajout du produit ${product.id}:`, error.message)
  }
})

// Afficher tous les produits
console.log('\n📋 Produits dans la base de données:')
const allProducts = db.prepare('SELECT id, name, price, image_url, images FROM products').all()
allProducts.forEach(product => {
  let imagesArray = []
  if (product.images) {
    try {
      imagesArray = JSON.parse(product.images)
    } catch (e) {
      imagesArray = []
    }
  }
  console.log(`\n  ID: ${product.id}`)
  console.log(`  Nom: ${product.name}`)
  console.log(`  Prix: ${product.price} MAD`)
  console.log(`  Image principale: ${product.image_url || 'Aucune'}`)
  console.log(`  Images secondaires: ${imagesArray.length} image(s)`)
  imagesArray.forEach((img, idx) => {
    console.log(`    - ${idx + 1}: ${img}`)
  })
})

db.close()
console.log('\n✅ Terminé!')

