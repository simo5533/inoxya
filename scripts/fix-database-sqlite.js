/**
 * Script de correction automatique de la base de données SQLite3
 * Crée les tables manquantes et les index recommandés
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

console.log('🔧 Démarrage des corrections de la base de données SQLite3...\n')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

// Créer le dossier data s'il n'existe pas
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

const corrections = {
  tables: { creees: 0, erreurs: [] },
  index: { crees: 0, erreurs: [] },
  colonnes: { ajoutees: 0, erreurs: [] }
}

// 1. Créer les tables manquantes
console.log('📋 Création des tables manquantes...\n')

// Table favorites
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      bijou_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, bijou_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bijou_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table favorites créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'favorites', error: error.message })
  console.log('  ⚠️  Erreur création favorites:', error.message)
}

// Table user_sessions
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table user_sessions créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'user_sessions', error: error.message })
  console.log('  ⚠️  Erreur création user_sessions:', error.message)
}

// Table custom_requests
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      type TEXT,
      description TEXT,
      budget REAL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table custom_requests créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'custom_requests', error: error.message })
  console.log('  ⚠️  Erreur création custom_requests:', error.message)
}

// Table reviews
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      bijou_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      is_approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (bijou_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table reviews créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'reviews', error: error.message })
  console.log('  ⚠️  Erreur création reviews:', error.message)
}

// Table newsletter_subscriptions
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table newsletter_subscriptions créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'newsletter_subscriptions', error: error.message })
  console.log('  ⚠️  Erreur création newsletter_subscriptions:', error.message)
}

// Table site_stats
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_views INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      orders_count INTEGER DEFAULT 0,
      revenue REAL DEFAULT 0,
      date DATE UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table site_stats créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'site_stats', error: error.message })
  console.log('  ⚠️  Erreur création site_stats:', error.message)
}

// Table shipping_addresses
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_id INTEGER,
      full_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      postal_code TEXT,
      phone TEXT,
      is_default BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table shipping_addresses créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'shipping_addresses', error: error.message })
  console.log('  ⚠️  Erreur création shipping_addresses:', error.message)
}

// Table promo_codes
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT CHECK(discount_type IN ('percentage', 'fixed')),
      discount_value REAL NOT NULL,
      min_order_amount REAL,
      usage_limit INTEGER,
      usage_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      valid_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table promo_codes créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'promo_codes', error: error.message })
  console.log('  ⚠️  Erreur création promo_codes:', error.message)
}

// Table contact_messages
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'replied', 'closed')),
      priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'urgent')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table contact_messages créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'contact_messages', error: error.message })
  console.log('  ⚠️  Erreur création contact_messages:', error.message)
}

// Table testimonials
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      testimonial TEXT NOT NULL,
      product_id INTEGER,
      is_featured BOOLEAN DEFAULT 0,
      is_approved BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table testimonials créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'testimonials', error: error.message })
  console.log('  ⚠️  Erreur création testimonials:', error.message)
}

// Table site_settings
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      setting_type TEXT DEFAULT 'string' CHECK(setting_type IN ('string', 'number', 'boolean', 'json')),
      description TEXT,
      category TEXT,
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  corrections.tables.creees++
  console.log('  ✅ Table site_settings créée')
} catch (error) {
  corrections.tables.erreurs.push({ table: 'site_settings', error: error.message })
  console.log('  ⚠️  Erreur création site_settings:', error.message)
}

// 2. Créer les index recommandés
console.log('\n📇 Création des index recommandés...\n')

const indexDefinitions = [
  { name: 'idx_products_category', table: 'products', column: 'category' },
  { name: 'idx_products_is_active', table: 'products', column: 'is_active' },
  { name: 'idx_products_created_at', table: 'products', column: 'created_at' },
  { name: 'idx_products_price', table: 'products', column: 'price' },
  { name: 'idx_users_phone', table: 'users', column: 'phone' },
  { name: 'idx_users_role', table: 'users', column: 'role' },
  { name: 'idx_orders_user_id', table: 'orders', column: 'user_id' },
  { name: 'idx_orders_status', table: 'orders', column: 'status' },
  { name: 'idx_orders_created_at', table: 'orders', column: 'created_at' },
  { name: 'idx_order_items_order_id', table: 'order_items', column: 'order_id' },
  { name: 'idx_order_items_bijou_id', table: 'order_items', column: 'bijou_id' },
  { name: 'idx_payments_order_id', table: 'payments', column: 'order_id' },
  { name: 'idx_payments_status', table: 'payments', column: 'status' },
  { name: 'idx_cart_items_user_id', table: 'cart_items', column: 'user_id' },
  { name: 'idx_cart_items_bijou_id', table: 'cart_items', column: 'bijou_id' },
  { name: 'idx_favorites_user_id', table: 'favorites', column: 'user_id' },
  { name: 'idx_favorites_bijou_id', table: 'favorites', column: 'bijou_id' },
  { name: 'idx_reviews_bijou_id', table: 'reviews', column: 'bijou_id' },
  { name: 'idx_reviews_user_id', table: 'reviews', column: 'user_id' },
  { name: 'idx_custom_requests_user_id', table: 'custom_requests', column: 'user_id' },
  { name: 'idx_custom_requests_status', table: 'custom_requests', column: 'status' }
]

indexDefinitions.forEach(idx => {
  try {
    // Vérifier si l'index existe déjà
    const existing = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='index' AND name=?
    `).get(idx.name)
    
    if (!existing) {
      db.exec(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table}(${idx.column})`)
      corrections.index.crees++
      console.log(`  ✅ Index ${idx.name} créé`)
    } else {
      console.log(`  ℹ️  Index ${idx.name} existe déjà`)
    }
  } catch (error) {
    corrections.index.erreurs.push({ index: idx.name, error: error.message })
    console.log(`  ⚠️  Erreur création ${idx.name}:`, error.message)
  }
})

// 3. Vérifier et ajouter les colonnes manquantes
console.log('\n🔧 Vérification des colonnes...\n')

// Vérifier si products a toutes les colonnes nécessaires
try {
  const productsColumns = db.prepare('PRAGMA table_info(products)').all()
  const columnNames = productsColumns.map(c => c.name)
  
  if (!columnNames.includes('images')) {
    db.exec('ALTER TABLE products ADD COLUMN images TEXT')
    corrections.colonnes.ajoutees++
    console.log('  ✅ Colonne images ajoutée à products')
  }
  
  if (!columnNames.includes('created_by')) {
    db.exec('ALTER TABLE products ADD COLUMN created_by TEXT')
    corrections.colonnes.ajoutees++
    console.log('  ✅ Colonne created_by ajoutée à products')
  }
} catch (error) {
  corrections.colonnes.erreurs.push({ table: 'products', error: error.message })
  console.log('  ⚠️  Erreur vérification colonnes products:', error.message)
}

// Résumé
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ DES CORRECTIONS')
console.log('='.repeat(60))
console.log(`\n✅ Tables créées: ${corrections.tables.creees}`)
console.log(`✅ Index créés: ${corrections.index.crees}`)
console.log(`✅ Colonnes ajoutées: ${corrections.colonnes.ajoutees}`)

if (corrections.tables.erreurs.length > 0) {
  console.log(`\n⚠️  Erreurs tables: ${corrections.tables.erreurs.length}`)
}

if (corrections.index.erreurs.length > 0) {
  console.log(`⚠️  Erreurs index: ${corrections.index.erreurs.length}`)
}

db.close()

console.log('\n✅ Corrections terminées!\n')
console.log('💡 Exécutez "npm run analyze:db" pour vérifier les améliorations\n')

process.exit(0)

