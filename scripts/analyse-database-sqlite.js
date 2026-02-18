/**
 * Script d'analyse approfondie de la base de données SQLite3
 * Vérifie la structure, les données, les index, et la configuration
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const results = {
  connexion: { status: false, error: null },
  tables: { attendues: [], existantes: [], manquantes: [], details: [] },
  colonnes: { problemes: [], manquantes: [] },
  index: { existants: [], manquants: [], recommandations: [] },
  donnees: { produits: 0, categories: 0, users: 0, packs: 0, commandes: 0 },
  configuration: { problemes: [], recommandations: [] },
  performance: { problemes: [], recommandations: [] },
  securite: { problemes: [], recommandations: [] }
}

// Tables attendues selon la documentation
const tablesAttendues = [
  'products',
  'users',
  'categories',
  'packs',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'notifications',
  'favorites',
  'user_sessions',
  'custom_requests',
  'reviews',
  'newsletter_subscriptions',
  'site_stats',
  'shipping_addresses',
  'promo_codes',
  'contact_messages',
  'testimonials',
  'site_settings'
]

// Structure attendue des tables principales
const structureAttendue = {
  products: ['id', 'name', 'name_ar', 'description', 'price', 'original_price', 'category', 'stock', 'is_active', 'image_url', 'images', 'created_by', 'created_at', 'updated_at'],
  users: ['id', 'phone', 'password_hash', 'first_name', 'last_name', 'role', 'created_at', 'updated_at'],
  categories: ['id', 'name', 'slug', 'description', 'image_url', 'created_at'],
  packs: ['id', 'name', 'slug', 'description', 'price', 'image_url', 'is_featured', 'created_at'],
  orders: ['id', 'user_id', 'total_amount', 'status', 'shipping_address', 'phone', 'notes', 'created_at'],
  order_items: ['id', 'order_id', 'bijou_id', 'quantity', 'price', 'created_at'],
  payments: ['id', 'order_id', 'amount', 'payment_method', 'status', 'transaction_id', 'created_at', 'updated_at'],
  cart_items: ['id', 'user_id', 'bijou_id', 'quantity', 'created_at']
}

// Index recommandés
const indexRecommandes = {
  products: ['category', 'is_active', 'created_at', 'price'],
  users: ['phone', 'role'],
  orders: ['user_id', 'status', 'created_at'],
  order_items: ['order_id', 'bijou_id'],
  payments: ['order_id', 'status'],
  cart_items: ['user_id', 'bijou_id']
}

console.log('🔍 Démarrage de l\'analyse de la base de données SQLite3...\n')

// Chemin vers la base de données
const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')

// Vérifier si le fichier existe
if (!fs.existsSync(dbPath)) {
  console.log('⚠️  Base de données non trouvée:', dbPath)
  console.log('📝 La base sera créée automatiquement au premier démarrage\n')
  results.connexion.status = false
  results.connexion.error = 'Fichier non trouvé'
} else {
  try {
    // Connexion à la base de données
    const db = new Database(dbPath, { readonly: true })
    
    // Activer les clés étrangères
    db.pragma('foreign_keys = ON')
    
    // Test de connexion
    const testResult = db.prepare('SELECT datetime(\'now\') as current_time').get()
    results.connexion.status = true
    console.log('✅ Connexion réussie:', testResult.current_time)
    
    // 1. Analyser les tables existantes
    console.log('\n📊 ANALYSE DES TABLES')
    console.log('='.repeat(60))
    
    const tablesExistantes = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all()
    
    results.tables.existantes = tablesExistantes.map(t => t.name)
    
    console.log(`Tables existantes: ${results.tables.existantes.length}`)
    results.tables.existantes.forEach(table => {
      console.log(`  ✅ ${table}`)
      
      // Analyser la structure de chaque table
      const schema = db.prepare(`PRAGMA table_info(${table})`).all()
      const colonnes = schema.map(col => col.name)
      
      results.tables.details.push({
        nom: table,
        colonnes: colonnes,
        count: db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count
      })
      
      // Vérifier la structure attendue
      if (structureAttendue[table]) {
        const colonnesManquantes = structureAttendue[table].filter(col => !colonnes.includes(col))
        if (colonnesManquantes.length > 0) {
          results.colonnes.manquantes.push({
            table,
            colonnes: colonnesManquantes
          })
        }
      }
    })
    
    // Tables manquantes
    results.tables.manquantes = tablesAttendues.filter(t => !results.tables.existantes.includes(t))
    if (results.tables.manquantes.length > 0) {
      console.log(`\n⚠️  Tables manquantes: ${results.tables.manquantes.length}`)
      results.tables.manquantes.forEach(table => {
        console.log(`  ❌ ${table}`)
      })
    }
    
    // 2. Analyser les index
    console.log('\n📇 ANALYSE DES INDEX')
    console.log('='.repeat(60))
    
    const indexExistants = db.prepare(`
      SELECT name, tbl_name FROM sqlite_master 
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `).all()
    
    results.index.existants = indexExistants.map(idx => ({ table: idx.tbl_name, name: idx.name }))
    console.log(`Index existants: ${results.index.existants.length}`)
    
    // Vérifier les index recommandés
    Object.keys(indexRecommandes).forEach(table => {
      if (results.tables.existantes.includes(table)) {
        indexRecommandes[table].forEach(col => {
          const indexName = `idx_${table}_${col}`
          const existe = results.index.existants.some(idx => idx.name === indexName)
          if (!existe) {
            results.index.manquants.push({ table, colonne: col, index: indexName })
          }
        })
      }
    })
    
    if (results.index.manquants.length > 0) {
      console.log(`\n⚠️  Index manquants: ${results.index.manquants.length}`)
      results.index.manquants.forEach(idx => {
        console.log(`  ❌ ${idx.index} sur ${idx.table}.${idx.colonne}`)
      })
    }
    
    // 3. Analyser les données
    console.log('\n📦 ANALYSE DES DONNÉES')
    console.log('='.repeat(60))
    
    if (results.tables.existantes.includes('products')) {
      results.donnees.produits = db.prepare('SELECT COUNT(*) as count FROM products').get().count
      console.log(`Produits: ${results.donnees.produits}`)
    }
    
    if (results.tables.existantes.includes('categories')) {
      results.donnees.categories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count
      console.log(`Catégories: ${results.donnees.categories}`)
    }
    
    if (results.tables.existantes.includes('users')) {
      results.donnees.users = db.prepare('SELECT COUNT(*) as count FROM users').get().count
      console.log(`Utilisateurs: ${results.donnees.users}`)
    }
    
    if (results.tables.existantes.includes('packs')) {
      results.donnees.packs = db.prepare('SELECT COUNT(*) as count FROM packs').get().count
      console.log(`Packs: ${results.donnees.packs}`)
    }
    
    if (results.tables.existantes.includes('orders')) {
      results.donnees.commandes = db.prepare('SELECT COUNT(*) as count FROM orders').get().count
      console.log(`Commandes: ${results.donnees.commandes}`)
    }
    
    // 4. Vérifier les clés étrangères
    console.log('\n🔗 ANALYSE DES CLÉS ÉTRANGÈRES')
    console.log('='.repeat(60))
    
    const foreignKeys = db.prepare('PRAGMA foreign_key_list(cart_items)').all()
    if (foreignKeys.length === 0) {
      results.configuration.problemes.push('Clés étrangères non activées ou non définies')
      console.log('⚠️  Clés étrangères: Non configurées')
    } else {
      console.log(`✅ Clés étrangères: ${foreignKeys.length} trouvées`)
    }
    
    // 5. Vérifier l'intégrité
    console.log('\n🔍 VÉRIFICATION DE L\'INTÉGRITÉ')
    console.log('='.repeat(60))
    
    // Vérifier les produits sans catégorie
    if (results.tables.existantes.includes('products')) {
      const produitsSansCategorie = db.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE category IS NULL OR category = ''
      `).get().count
      
      if (produitsSansCategorie > 0) {
        results.donnees.problemes = results.donnees.problemes || []
        results.donnees.problemes.push(`${produitsSansCategorie} produits sans catégorie`)
        console.log(`⚠️  Produits sans catégorie: ${produitsSansCategorie}`)
      }
    }
    
    // 6. Performance
    console.log('\n⚡ ANALYSE DE PERFORMANCE')
    console.log('='.repeat(60))
    
    // Vérifier la taille de la base
    const stats = fs.statSync(dbPath)
    const tailleMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`Taille de la base: ${tailleMB} MB`)
    
    if (stats.size > 100 * 1024 * 1024) { // > 100MB
      results.performance.recommandations.push('Base de données > 100MB, considérer le nettoyage')
    }
    
    // Vérifier les requêtes lentes potentielles
    if (results.index.manquants.length > 5) {
      results.performance.problemes.push('Trop d\'index manquants, risque de ralentissement')
    }
    
    db.close()
    
  } catch (error) {
    results.connexion.status = false
    results.connexion.error = error.message
    console.log('❌ Erreur de connexion:', error.message)
  }
}

// Calculer le pourcentage de qualité
function calculateQuality() {
  let totalPoints = 0
  let pointsObtenus = 0
  
  // Connexion (20 points)
  totalPoints += 20
  if (results.connexion.status) pointsObtenus += 20
  
  // Tables (30 points)
  totalPoints += 30
  const tablesRatio = results.tables.existantes.length / tablesAttendues.length
  pointsObtenus += 30 * Math.min(tablesRatio, 1)
  
  // Colonnes (15 points)
  totalPoints += 15
  if (results.colonnes.manquantes.length === 0) pointsObtenus += 15
  else pointsObtenus += 15 * (1 - results.colonnes.manquantes.length / 10)
  
  // Index (15 points)
  totalPoints += 15
  const totalIndexRecommandes = Object.values(indexRecommandes).flat().length
  const indexRatio = 1 - (results.index.manquants.length / Math.max(totalIndexRecommandes, 1))
  pointsObtenus += 15 * Math.max(indexRatio, 0)
  
  // Données (10 points)
  totalPoints += 10
  if (results.donnees.produits > 0 && results.donnees.categories > 0) pointsObtenus += 10
  else if (results.donnees.produits > 0 || results.donnees.categories > 0) pointsObtenus += 5
  
  // Configuration (10 points)
  totalPoints += 10
  if (results.configuration.problemes.length === 0) pointsObtenus += 10
  else pointsObtenus += 10 * (1 - results.configuration.problemes.length / 5)
  
  const quality = Math.round((pointsObtenus / totalPoints) * 100)
  return { quality, totalPoints, pointsObtenus }
}

// Générer le rapport
console.log('\n' + '='.repeat(60))
console.log('📊 RAPPORT D\'ANALYSE')
console.log('='.repeat(60))

const quality = calculateQuality()

console.log('\n🎯 QUALITÉ GLOBALE')
console.log(`Pourcentage: ${quality.quality}%`)
console.log(`Points: ${quality.pointsObtenus}/${quality.totalPoints}`)

// Résumé des problèmes
const totalProblemes = 
  results.tables.manquantes.length +
  results.colonnes.manquantes.length +
  results.index.manquants.length +
  results.configuration.problemes.length +
  results.performance.problemes.length

console.log(`\n⚠️  Problèmes identifiés: ${totalProblemes}`)

if (totalProblemes > 0) {
  console.log('\n📋 DÉTAILS DES PROBLÈMES:')
  
  if (results.tables.manquantes.length > 0) {
    console.log(`\n1. Tables manquantes (${results.tables.manquantes.length}):`)
    results.tables.manquantes.forEach(t => console.log(`   - ${t}`))
  }
  
  if (results.colonnes.manquantes.length > 0) {
    console.log(`\n2. Colonnes manquantes (${results.colonnes.manquantes.length} tables):`)
    results.colonnes.manquantes.forEach(c => {
      console.log(`   - ${c.table}: ${c.colonnes.join(', ')}`)
    })
  }
  
  if (results.index.manquants.length > 0) {
    console.log(`\n3. Index manquants (${results.index.manquants.length}):`)
    results.index.manquants.slice(0, 10).forEach(idx => {
      console.log(`   - ${idx.index} sur ${idx.table}.${idx.colonne}`)
    })
    if (results.index.manquants.length > 10) {
      console.log(`   ... et ${results.index.manquants.length - 10} autres`)
    }
  }
  
  if (results.configuration.problemes.length > 0) {
    console.log(`\n4. Problèmes de configuration (${results.configuration.problemes.length}):`)
    results.configuration.problemes.forEach(p => console.log(`   - ${p}`))
  }
  
  if (results.performance.problemes.length > 0) {
    console.log(`\n5. Problèmes de performance (${results.performance.problemes.length}):`)
    results.performance.problemes.forEach(p => console.log(`   - ${p}`))
  }
}

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_ANALYSE_DATABASE_SQLITE.md')
const reportContent = `# 📊 RAPPORT D'ANALYSE - BASE DE DONNÉES SQLITE3

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Base de données:** \`data/inoxya_bijoux.db\`  
**Qualité globale:** **${quality.quality}%**

---

## 🔍 RÉSUMÉ EXÉCUTIF

### État de la Base de Données
- **Connexion:** ${results.connexion.status ? '✅ OK' : '❌ ÉCHEC'}
- **Tables existantes:** ${results.tables.existantes.length}/${tablesAttendues.length}
- **Tables manquantes:** ${results.tables.manquantes.length}
- **Index manquants:** ${results.index.manquants.length}
- **Problèmes de configuration:** ${results.configuration.problemes.length}

### Données
- **Produits:** ${results.donnees.produits}
- **Catégories:** ${results.donnees.categories}
- **Utilisateurs:** ${results.donnees.users}
- **Packs:** ${results.donnees.packs}
- **Commandes:** ${results.donnees.commandes}

---

## 📋 DÉTAILS PAR CATÉGORIE

### 1. Tables (${results.tables.existantes.length}/${tablesAttendues.length})

#### Tables Existantes
${results.tables.existantes.map(t => `- ✅ ${t}`).join('\n')}

#### Tables Manquantes
${results.tables.manquantes.length > 0 ? results.tables.manquantes.map(t => `- ❌ ${t}`).join('\n') : '- Aucune'}

### 2. Colonnes Manquantes
${results.colonnes.manquantes.length > 0 ? results.colonnes.manquantes.map(c => `- **${c.table}**: ${c.colonnes.join(', ')}`).join('\n') : '- Aucune'}

### 3. Index Manquants
${results.index.manquants.length > 0 ? results.index.manquants.map(idx => `- **${idx.index}** sur \`${idx.table}.${idx.colonne}\``).join('\n') : '- Aucun'}

### 4. Problèmes de Configuration
${results.configuration.problemes.map(p => `- ⚠️ ${p}`).join('\n') || '- Aucun'}

### 5. Problèmes de Performance
${results.performance.problemes.map(p => `- ⚠️ ${p}`).join('\n') || '- Aucun'}

---

## 🎯 RECOMMANDATIONS

### Priorité Haute
${results.tables.manquantes.length > 0 ? `1. Créer les tables manquantes (${results.tables.manquantes.length})` : '1. ✅ Toutes les tables existent'}
${results.colonnes.manquantes.length > 0 ? `2. Ajouter les colonnes manquantes` : '2. ✅ Structure complète'}

### Priorité Moyenne
${results.index.manquants.length > 0 ? `3. Créer les index manquants (${results.index.manquants.length})` : '3. ✅ Index complets'}
${results.donnees.produits === 0 ? '4. Ajouter des produits de test' : '4. ✅ Données présentes'}

### Priorité Basse
5. Optimiser les requêtes
6. Configurer les sauvegardes automatiques

---

## 📊 SCORE DÉTAILLÉ

| Catégorie | Score | État |
|-----------|-------|------|
| **Connexion** | ${results.connexion.status ? '20/20' : '0/20'} | ${results.connexion.status ? '✅' : '❌'} |
| **Tables** | ${Math.round(30 * (results.tables.existantes.length / tablesAttendues.length))}/30 | ${results.tables.existantes.length === tablesAttendues.length ? '✅' : '⚠️'} |
| **Colonnes** | ${results.colonnes.manquantes.length === 0 ? '15/15' : Math.round(15 * (1 - results.colonnes.manquantes.length / 10)) + '/15'} | ${results.colonnes.manquantes.length === 0 ? '✅' : '⚠️'} |
| **Index** | ${Math.round(15 * (1 - results.index.manquants.length / 20))}/15 | ${results.index.manquants.length === 0 ? '✅' : '⚠️'} |
| **Données** | ${results.donnees.produits > 0 && results.donnees.categories > 0 ? '10/10' : '5/10'} | ${results.donnees.produits > 0 ? '✅' : '⚠️'} |
| **Configuration** | ${results.configuration.problemes.length === 0 ? '10/10' : Math.round(10 * (1 - results.configuration.problemes.length / 5)) + '/10'} | ${results.configuration.problemes.length === 0 ? '✅' : '⚠️'} |

**Total:** ${quality.pointsObtenus}/${quality.totalPoints} = **${quality.quality}%**

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`)

process.exit(0)

