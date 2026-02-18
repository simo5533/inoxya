/**
 * Script de test phase par phase du projet full stack
 */

const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')

const results = {
  phase1: { name: 'Base de données', tests: [], passed: 0, failed: 0 },
  phase2: { name: 'API Routes', tests: [], passed: 0, failed: 0 },
  phase3: { name: 'Pages et composants', tests: [], passed: 0, failed: 0 },
  phase4: { name: 'Authentification et sécurité', tests: [], passed: 0, failed: 0 }
}

console.log('🧪 TESTS PHASE PAR PHASE DU PROJET FULL STACK')
console.log('='.repeat(70))
console.log('')

// PHASE 1: Base de données
console.log('💾 PHASE 1: TEST BASE DE DONNÉES')
console.log('-'.repeat(70))

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  results.phase1.tests.push({ name: 'Base de données existe', passed: true })
  results.phase1.passed++
  console.log(`  ✅ Base de données trouvée (${sizeMB} MB)`)
} else {
  results.phase1.tests.push({ name: 'Base de données existe', passed: false, error: 'Fichier non trouvé' })
  results.phase1.failed++
  console.log(`  ❌ Base de données non trouvée`)
}

// Vérifier les fichiers de base de données
const dbFiles = [
  'lib/database-adapter.ts',
  'lib/sqlite.ts',
  'lib/postgres.ts',
  'lib/database.ts'
]

dbFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    results.phase1.tests.push({ name: `Fichier ${file}`, passed: true })
    results.phase1.passed++
    console.log(`  ✅ ${file}`)
  } else {
    results.phase1.tests.push({ name: `Fichier ${file}`, passed: false, error: 'Fichier manquant' })
    results.phase1.failed++
    console.log(`  ❌ ${file} - MANQUANT`)
  }
})

// PHASE 2: API Routes
console.log('\n🔌 PHASE 2: TEST API ROUTES')
console.log('-'.repeat(70))

const apiRoutes = [
  { path: 'app/api/products/route.ts', name: 'GET /api/products' },
  { path: 'app/api/products/[id]/route.ts', name: 'GET /api/products/:id' },
  { path: 'app/api/orders/route.ts', name: 'GET /api/orders' },
  { path: 'app/api/cart/route.ts', name: 'GET /api/cart' },
  { path: 'app/api/favorites/route.ts', name: 'GET /api/favorites' },
  { path: 'app/api/checkout/route.ts', name: 'POST /api/checkout' },
  { path: 'app/api/auth/login/route.ts', name: 'POST /api/auth/login' },
  { path: 'app/api/auth/register/route.ts', name: 'POST /api/auth/register' }
]

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route.path)
  if (fs.existsSync(routePath)) {
    const content = fs.readFileSync(routePath, 'utf-8')
    const hasExport = content.includes('export') && (content.includes('GET') || content.includes('POST') || content.includes('PUT') || content.includes('DELETE'))
    
    if (hasExport) {
      results.phase2.tests.push({ name: route.name, passed: true })
      results.phase2.passed++
      console.log(`  ✅ ${route.name}`)
    } else {
      results.phase2.tests.push({ name: route.name, passed: false, error: 'Pas d\'export de méthode HTTP' })
      results.phase2.failed++
      console.log(`  ⚠️  ${route.name} - Pas d'export`)
    }
  } else {
    results.phase2.tests.push({ name: route.name, passed: false, error: 'Fichier manquant' })
    results.phase2.failed++
    console.log(`  ❌ ${route.name} - MANQUANT`)
  }
})

// PHASE 3: Pages et composants
console.log('\n🧩 PHASE 3: TEST PAGES ET COMPOSANTS')
console.log('-'.repeat(70))

const pages = [
  'app/page.tsx',
  'app/bijoux/page.tsx',
  'app/panier/page.tsx',
  'app/login/page.tsx',
  'app/inscription/page.tsx',
  'app/profile/page.tsx',
  'app/admin/page.tsx'
]

pages.forEach(page => {
  const pagePath = path.join(process.cwd(), page)
  if (fs.existsSync(pagePath)) {
    results.phase3.tests.push({ name: page, passed: true })
    results.phase3.passed++
    console.log(`  ✅ ${page}`)
  } else {
    results.phase3.tests.push({ name: page, passed: false, error: 'Fichier manquant' })
    results.phase3.failed++
    console.log(`  ❌ ${page} - MANQUANT`)
  }
})

const components = [
  'components/Header.tsx',
  'components/Footer.tsx',
  'components/ProductCard.tsx',
  'components/Cart.tsx'
]

components.forEach(comp => {
  const compPath = path.join(process.cwd(), comp)
  if (fs.existsSync(compPath)) {
    results.phase3.tests.push({ name: comp, passed: true })
    results.phase3.passed++
    console.log(`  ✅ ${comp}`)
  } else {
    results.phase3.tests.push({ name: comp, passed: false, error: 'Fichier manquant' })
    results.phase3.failed++
    console.log(`  ❌ ${comp} - MANQUANT`)
  }
})

// PHASE 4: Authentification et sécurité
console.log('\n🔒 PHASE 4: TEST AUTHENTIFICATION ET SÉCURITÉ')
console.log('-'.repeat(70))

const securityFiles = [
  { path: 'middleware.ts', name: 'Middleware Next.js' },
  { path: 'lib/security.ts', name: 'Librairie sécurité' },
  { path: 'lib/admin-auth.ts', name: 'Authentification admin' },
  { path: 'lib/auth.ts', name: 'Authentification utilisateur' }
]

securityFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file.path)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    let hasSecurity = false
    
    if (file.path === 'middleware.ts') {
      hasSecurity = content.includes('Strict-Transport-Security') || content.includes('HSTS')
    } else if (file.path.includes('auth')) {
      hasSecurity = content.includes('getCurrentUser') || content.includes('requireAdmin') || content.includes('loginUser')
    } else {
      hasSecurity = content.includes('JWT') || content.includes('session') || content.includes('secure')
    }
    
    if (hasSecurity) {
      results.phase4.tests.push({ name: file.name, passed: true })
      results.phase4.passed++
      console.log(`  ✅ ${file.name}`)
    } else {
      results.phase4.tests.push({ name: file.name, passed: false, error: 'Fonctionnalités de sécurité manquantes' })
      results.phase4.failed++
      console.log(`  ⚠️  ${file.name} - Sécurité incomplète`)
    }
  } else {
    results.phase4.tests.push({ name: file.name, passed: false, error: 'Fichier manquant' })
    results.phase4.failed++
    console.log(`  ❌ ${file.name} - MANQUANT`)
  }
})

// Résumé
console.log('\n' + '='.repeat(70))
console.log('📊 RÉSUMÉ DES TESTS')
console.log('='.repeat(70))

const phases = [results.phase1, results.phase2, results.phase3, results.phase4]
let totalPassed = 0
let totalFailed = 0

phases.forEach(phase => {
  const total = phase.passed + phase.failed
  const percentage = total > 0 ? ((phase.passed / total) * 100).toFixed(1) : 0
  console.log(`\n${phase.name}:`)
  console.log(`  ✅ Réussis: ${phase.passed}`)
  console.log(`  ❌ Échoués: ${phase.failed}`)
  console.log(`  📊 Taux de réussite: ${percentage}%`)
  totalPassed += phase.passed
  totalFailed += phase.failed
})

const totalTests = totalPassed + totalFailed
const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0

console.log('\n' + '='.repeat(70))
console.log(`🎯 RÉSULTAT GLOBAL: ${overallPercentage}%`)
console.log(`   ✅ Total réussis: ${totalPassed}`)
console.log(`   ❌ Total échoués: ${totalFailed}`)
console.log('='.repeat(70))

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_TESTS_PHASES.md')
const reportContent = `# 📊 RAPPORT - TESTS PHASE PAR PHASE

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Taux de réussite global:** **${overallPercentage}%**

---

## 📋 DÉTAILS PAR PHASE

${phases.map(phase => {
  const total = phase.passed + phase.failed
  const percentage = total > 0 ? ((phase.passed / total) * 100).toFixed(1) : 0
  return `### ${phase.name} (${percentage}%)

**Réussis:** ${phase.passed} | **Échoués:** ${phase.failed}

${phase.tests.map(test => 
  test.passed 
    ? `- ✅ ${test.name}` 
    : `- ❌ ${test.name}${test.error ? ` - ${test.error}` : ''}`
).join('\n')}`
}).join('\n\n')}

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`)

process.exit(totalFailed > 0 ? 1 : 0)

