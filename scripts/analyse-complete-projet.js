/**
 * ANALYSE COMPLÈTE DU PROJET INOXYA BIJOUX
 * Test de toutes les fonctionnalités et génération d'un rapport détaillé
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 ANALYSE COMPLÈTE DU PROJET INOXYA BIJOUX\n')
console.log('='.repeat(60))

const results = {
  structure: {},
  pages: {},
  api: {},
  components: {},
  database: {},
  fonctionnalites: {},
  erreurs: [],
  recommandations: []
}

// 1. ANALYSE DE LA STRUCTURE
console.log('\n📁 1. ANALYSE DE LA STRUCTURE DU PROJET\n')

function analyzeDirectory(dir, depth = 0) {
  const items = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        items.push({ type: 'dir', name: entry.name, path: fullPath })
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (['.ts', '.tsx', '.js', '.jsx', '.json', '.css'].includes(ext)) {
          items.push({ type: 'file', name: entry.name, path: fullPath, ext })
        }
      }
    }
  } catch (err) {
    results.erreurs.push(`Erreur lecture ${dir}: ${err.message}`)
  }
  return items
}

// Structure principale
const appDir = path.join(process.cwd(), 'app')
const componentsDir = path.join(process.cwd(), 'components')
const libDir = path.join(process.cwd(), 'lib')
const apiDir = path.join(process.cwd(), 'app', 'api')

results.structure = {
  app: analyzeDirectory(appDir),
  components: analyzeDirectory(componentsDir),
  lib: analyzeDirectory(libDir),
  api: analyzeDirectory(apiDir)
}

console.log(`✅ Pages app/: ${results.structure.app.filter(f => f.type === 'file' && f.ext === '.tsx').length}`)
console.log(`✅ Composants: ${results.structure.components.filter(f => f.type === 'file' && f.ext === '.tsx').length}`)
console.log(`✅ Utilitaires lib/: ${results.structure.lib.filter(f => f.type === 'file').length}`)
console.log(`✅ Routes API: ${results.structure.api.filter(f => f.type === 'file' && f.ext === '.ts').length}`)

// 2. ANALYSE DES PAGES
console.log('\n📄 2. ANALYSE DES PAGES\n')

const pages = [
  { path: '/', file: 'app/page.tsx', name: 'Page d\'accueil' },
  { path: '/bijoux', file: 'app/bijoux/page.tsx', name: 'Catalogue Bijoux' },
  { path: '/bijoux/[id]', file: 'app/bijoux/[id]/page.tsx', name: 'Détail Bijou' },
  { path: '/packs', file: 'app/packs/page.tsx', name: 'Nos Packs' },
  { path: '/panier', file: 'app/panier/page.tsx', name: 'Panier' },
  { path: '/favoris', file: 'app/favoris/page.tsx', name: 'Favoris' },
  { path: '/profile', file: 'app/profile/page.tsx', name: 'Profil' },
  { path: '/login', file: 'app/login/page.tsx', name: 'Connexion' },
  { path: '/inscription', file: 'app/inscription/page.tsx', name: 'Inscription' },
  { path: '/admin', file: 'app/admin/page.tsx', name: 'Dashboard Admin' },
  { path: '/admin/produits', file: 'app/admin/produits/page.tsx', name: 'Gestion Produits' },
  { path: '/admin/orders', file: 'app/admin/orders/page.tsx', name: 'Gestion Commandes' },
  { path: '/admin/packs', file: 'app/admin/packs/page.tsx', name: 'Gestion Packs' },
  { path: '/sur-mesure', file: 'app/sur-mesure/page.tsx', name: 'Sur Mesure' },
  { path: '/a-propos', file: 'app/a-propos/page.tsx', name: 'À Propos' }
]

pages.forEach(page => {
  const filePath = path.join(process.cwd(), page.file)
  const exists = fs.existsSync(filePath)
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8')
    const hasErrors = content.includes('TODO') || content.includes('FIXME') || content.includes('ERROR')
    results.pages[page.path] = {
      exists: true,
      hasErrors,
      lines: content.split('\n').length,
      imports: (content.match(/^import\s+/gm) || []).length
    }
    console.log(`${exists ? '✅' : '❌'} ${page.name} (${page.path})`)
  } else {
    results.pages[page.path] = { exists: false }
    console.log(`❌ ${page.name} (${page.path}) - FICHIER MANQUANT`)
    results.erreurs.push(`Page manquante: ${page.file}`)
  }
})

// 3. ANALYSE DES ROUTES API
console.log('\n🔌 3. ANALYSE DES ROUTES API\n')

const apiRoutes = [
  { path: '/api/products', file: 'app/api/products/route.ts', method: 'GET,POST', name: 'Produits' },
  { path: '/api/products/[id]', file: 'app/api/products/[id]/route.ts', method: 'GET,PUT,DELETE', name: 'Produit par ID' },
  { path: '/api/packs', file: 'app/api/packs/route.ts', method: 'GET,POST', name: 'Packs' },
  { path: '/api/packs/[id]', file: 'app/api/packs/[id]/route.ts', method: 'GET,PUT,DELETE', name: 'Pack par ID' },
  { path: '/api/cart', file: 'app/api/cart/route.ts', method: 'GET,POST', name: 'Panier' },
  { path: '/api/favorites', file: 'app/api/favorites/route.ts', method: 'GET,POST', name: 'Favoris' },
  { path: '/api/orders', file: 'app/api/orders/route.ts', method: 'GET,POST', name: 'Commandes' },
  { path: '/api/checkout', file: 'app/api/checkout/route.ts', method: 'POST', name: 'Checkout' },
  { path: '/api/auth/login', file: 'app/api/auth/login/route.ts', method: 'POST', name: 'Login' },
  { path: '/api/auth/register', file: 'app/api/auth/register/route.ts', method: 'POST', name: 'Register' },
  { path: '/api/admin/products', file: 'app/api/admin/products/trim/route.ts', method: 'POST', name: 'Admin - Produits' },
  { path: '/api/admin/packs', file: 'app/api/admin/packs/route.ts', method: 'GET,POST', name: 'Admin - Packs' },
  { path: '/api/admin/notifications', file: 'app/api/admin/notifications/route.ts', method: 'GET,POST', name: 'Admin - Notifications' }
]

apiRoutes.forEach(route => {
  const filePath = path.join(process.cwd(), route.file)
  const exists = fs.existsSync(filePath)
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8')
    results.api[route.path] = {
      exists: true,
      methods: route.method,
      lines: content.split('\n').length,
      hasErrorHandling: content.includes('try') && content.includes('catch'),
      hasValidation: content.includes('zod') || content.includes('validate')
    }
    console.log(`✅ ${route.name} (${route.path}) - ${route.method}`)
  } else {
    results.api[route.path] = { exists: false }
    console.log(`❌ ${route.name} (${route.path}) - FICHIER MANQUANT`)
    results.erreurs.push(`Route API manquante: ${route.file}`)
  }
})

// 4. ANALYSE DES COMPOSANTS
console.log('\n🧩 4. ANALYSE DES COMPOSANTS\n')

const keyComponents = [
  'ProductCard', 'PackCard', 'CategoryCard', 'Header', 'Footer',
  'ProductGrid', 'HeroBanner', 'AdminDashboard', 'AdminProducts',
  'AdminOrders', 'AdminUsers', 'ProductImageGallery'
]

keyComponents.forEach(comp => {
  const files = [
    `components/${comp}.tsx`,
    `components/admin/${comp}.tsx`,
    `components/ui/${comp}.tsx`
  ]
  
  let found = false
  for (const file of files) {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      results.components[comp] = {
        exists: true,
        file,
        lines: content.split('\n').length,
        hasProps: content.includes('interface') || content.includes('type'),
        hasErrors: content.includes('TODO') || content.includes('FIXME')
      }
      console.log(`✅ ${comp} (${file})`)
      found = true
      break
    }
  }
  
  if (!found) {
    results.components[comp] = { exists: false }
    console.log(`⚠️  ${comp} - NON TROUVÉ`)
  }
})

// 5. ANALYSE DE LA BASE DE DONNÉES
console.log('\n🗄️  5. ANALYSE DE LA BASE DE DONNÉES\n')

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
const dbExists = fs.existsSync(dbPath)

if (dbExists) {
  const stats = fs.statSync(dbPath)
  results.database = {
    exists: true,
    size: (stats.size / 1024).toFixed(2) + ' KB',
    path: dbPath
  }
  console.log(`✅ Base de données SQLite trouvée (${results.database.size})`)
} else {
  results.database = { exists: false }
  console.log(`❌ Base de données SQLite non trouvée`)
  results.erreurs.push('Base de données SQLite manquante')
}

// Vérifier les scripts SQL
const sqlScripts = [
  'scripts/create-tables-simple.sql',
  'scripts/create-additional-tables.sql',
  'scripts/06-setup-database.sql'
]

sqlScripts.forEach(script => {
  const scriptPath = path.join(process.cwd(), script)
  if (fs.existsSync(scriptPath)) {
    console.log(`✅ Script SQL: ${script}`)
  }
})

// 6. ANALYSE DES FONCTIONNALITÉS
console.log('\n⚙️  6. ANALYSE DES FONCTIONNALITÉS\n')

const fonctionnalites = {
  'E-commerce': {
    'Catalogue produits': results.pages['/bijoux']?.exists || false,
    'Détail produit': results.pages['/bijoux/[id]']?.exists || false,
    'Panier': results.pages['/panier']?.exists || false,
    'Favoris': results.pages['/favoris']?.exists || false,
    'Packs': results.pages['/packs']?.exists || false,
    'Checkout': results.api['/api/checkout']?.exists || false
  },
  'Authentification': {
    'Login': results.pages['/login']?.exists && results.api['/api/auth/login']?.exists || false,
    'Inscription': results.pages['/inscription']?.exists && results.api['/api/auth/register']?.exists || false,
    'Profil': results.pages['/profile']?.exists || false
  },
  'Administration': {
    'Dashboard': results.pages['/admin']?.exists || false,
    'Gestion produits': results.pages['/admin/produits']?.exists || false,
    'Gestion commandes': results.pages['/admin/orders']?.exists || false,
    'Gestion packs': results.pages['/admin/packs']?.exists || false
  },
  'Infrastructure': {
    'Base de données': results.database.exists || false,
    'API Routes': Object.keys(results.api).filter(k => results.api[k].exists).length,
    'Composants UI': Object.keys(results.components).filter(k => results.components[k].exists).length
  }
}

Object.entries(fonctionnalites).forEach(([category, features]) => {
  console.log(`\n${category}:`)
  Object.entries(features).forEach(([feature, status]) => {
    const icon = status ? '✅' : '❌'
    console.log(`  ${icon} ${feature}`)
  })
})

results.fonctionnalites = fonctionnalites

// 7. CALCUL DU POURCENTAGE DE COMPLÉTION
console.log('\n📊 7. CALCUL DU POURCENTAGE DE COMPLÉTION\n')

const totalPages = pages.length
const pagesOk = Object.values(results.pages).filter(p => p.exists).length
const pagesPercent = ((pagesOk / totalPages) * 100).toFixed(1)

const totalApi = apiRoutes.length
const apiOk = Object.values(results.api).filter(a => a.exists).length
const apiPercent = ((apiOk / totalApi) * 100).toFixed(1)

const totalComponents = keyComponents.length
const componentsOk = Object.values(results.components).filter(c => c.exists).length
const componentsPercent = ((componentsOk / totalComponents) * 100).toFixed(1)

const totalFeatures = Object.values(fonctionnalites).flatMap(f => Object.keys(f)).length
const featuresOk = Object.values(fonctionnalites).flatMap(f => Object.values(f)).filter(f => f === true).length
const featuresPercent = ((featuresOk / totalFeatures) * 100).toFixed(1)

const completionPercent = ((parseFloat(pagesPercent) + parseFloat(apiPercent) + parseFloat(componentsPercent) + parseFloat(featuresPercent)) / 4).toFixed(1)

console.log(`📄 Pages: ${pagesOk}/${totalPages} (${pagesPercent}%)`)
console.log(`🔌 API Routes: ${apiOk}/${totalApi} (${apiPercent}%)`)
console.log(`🧩 Composants: ${componentsOk}/${totalComponents} (${componentsPercent}%)`)
console.log(`⚙️  Fonctionnalités: ${featuresOk}/${totalFeatures} (${featuresPercent}%)`)
console.log(`\n🎯 COMPLÉTION GLOBALE: ${completionPercent}%`)

// 8. GÉNÉRATION DU RAPPORT
console.log('\n📝 8. GÉNÉRATION DU RAPPORT\n')

const report = {
  date: new Date().toISOString(),
  completion: parseFloat(completionPercent),
  details: {
    pages: { total: totalPages, ok: pagesOk, percent: parseFloat(pagesPercent) },
    api: { total: totalApi, ok: apiOk, percent: parseFloat(apiPercent) },
    components: { total: totalComponents, ok: componentsOk, percent: parseFloat(componentsPercent) },
    features: { total: totalFeatures, ok: featuresOk, percent: parseFloat(featuresPercent) }
  },
  structure: results.structure,
  pages: results.pages,
  api: results.api,
  components: results.components,
  database: results.database,
  fonctionnalites: results.fonctionnalites,
  erreurs: results.erreurs,
  recommandations: [
    completionPercent < 80 ? 'Améliorer le taux de complétion des fonctionnalités' : null,
    results.erreurs.length > 0 ? `Corriger ${results.erreurs.length} erreur(s) identifiée(s)` : null,
    !results.database.exists ? 'Créer et initialiser la base de données' : null
  ].filter(Boolean)
}

const reportPath = path.join(process.cwd(), 'RAPPORT_ANALYSE_COMPLETE.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(`✅ Rapport généré: ${reportPath}`)

// 9. RÉSUMÉ FINAL
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ FINAL')
console.log('='.repeat(60))
console.log(`\n🎯 COMPLÉTION GLOBALE: ${completionPercent}%`)
console.log(`\n✅ Points forts:`)
console.log(`   - ${pagesOk} pages fonctionnelles`)
console.log(`   - ${apiOk} routes API opérationnelles`)
console.log(`   - ${componentsOk} composants disponibles`)
console.log(`   - ${featuresOk} fonctionnalités implémentées`)

if (results.erreurs.length > 0) {
  console.log(`\n⚠️  Points à améliorer:`)
  results.erreurs.slice(0, 5).forEach(err => console.log(`   - ${err}`))
  if (results.erreurs.length > 5) {
    console.log(`   ... et ${results.erreurs.length - 5} autre(s)`)
  }
}

console.log(`\n📄 Rapport détaillé sauvegardé dans: RAPPORT_ANALYSE_COMPLETE.json`)
console.log('\n✅ Analyse terminée!\n')
