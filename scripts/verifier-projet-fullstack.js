/**
 * Script de vérification complète du projet full stack
 * Vérifie: Frontend, Backend, API, Base de données, Sécurité
 */

const fs = require('fs')
const path = require('path')

const results = {
  structure: { issues: [], fixed: [] },
  api: { issues: [], fixed: [] },
  database: { issues: [], fixed: [] },
  components: { issues: [], fixed: [] },
  security: { issues: [], fixed: [] },
  config: { issues: [], fixed: [] }
}

console.log('🔍 VÉRIFICATION COMPLÈTE DU PROJET FULL STACK')
console.log('='.repeat(70))
console.log('')

// 1. Vérifier la structure du projet
console.log('📁 PHASE 1: VÉRIFICATION DE LA STRUCTURE')
console.log('-'.repeat(70))

const requiredDirs = [
  'app',
  'app/api',
  'components',
  'lib',
  'public',
  'styles',
  'scripts'
]

const requiredFiles = [
  'next.config.mjs',
  'tsconfig.json',
  'package.json',
  'middleware.ts',
  '.eslintrc.json',
  'lib/database-adapter.ts',
  'lib/auth.ts',
  'lib/security.ts'
]

requiredDirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(dirPath)) {
    results.structure.issues.push(`Dossier manquant: ${dir}`)
    console.log(`  ❌ ${dir} - MANQUANT`)
  } else {
    console.log(`  ✅ ${dir}`)
  }
})

requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    results.structure.issues.push(`Fichier manquant: ${file}`)
    console.log(`  ❌ ${file} - MANQUANT`)
  } else {
    console.log(`  ✅ ${file}`)
  }
})

// 2. Vérifier les routes API
console.log('\n🔌 PHASE 2: VÉRIFICATION DES ROUTES API')
console.log('-'.repeat(70))

const apiRoutes = [
  'app/api/products/route.ts',
  'app/api/products/[id]/route.ts',
  'app/api/orders/route.ts',
  'app/api/cart/route.ts',
  'app/api/favorites/route.ts',
  'app/api/checkout/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/register/route.ts'
]

apiRoutes.forEach(route => {
  const routePath = path.join(process.cwd(), route)
  if (!fs.existsSync(routePath)) {
    results.api.issues.push(`Route API manquante: ${route}`)
    console.log(`  ❌ ${route} - MANQUANT`)
  } else {
    // Vérifier la protection
    const content = fs.readFileSync(routePath, 'utf-8')
    const isAdminRoute = route.includes('/admin/')
    const hasAuth = content.includes('getCurrentUser') || content.includes('requireAdmin')
    
    if (isAdminRoute && !hasAuth) {
      results.api.issues.push(`Route admin non protégée: ${route}`)
      console.log(`  ⚠️  ${route} - NON PROTÉGÉE`)
    } else {
      console.log(`  ✅ ${route}`)
    }
  }
})

// 3. Vérifier la base de données
console.log('\n💾 PHASE 3: VÉRIFICATION DE LA BASE DE DONNÉES')
console.log('-'.repeat(70))

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`  ✅ Base de données trouvée (${sizeMB} MB)`)
  
  // Vérifier les fichiers de base de données
  const dbFiles = [
    'lib/database-adapter.ts',
    'lib/sqlite.ts',
    'lib/postgres.ts'
  ]
  
  dbFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`)
    } else {
      results.database.issues.push(`Fichier DB manquant: ${file}`)
      console.log(`  ❌ ${file} - MANQUANT`)
    }
  })
} else {
  results.database.issues.push('Base de données non trouvée')
  console.log('  ❌ Base de données non trouvée')
}

// 4. Vérifier les composants essentiels
console.log('\n🧩 PHASE 4: VÉRIFICATION DES COMPOSANTS')
console.log('-'.repeat(70))

const essentialComponents = [
  'components/Header.tsx',
  'components/Footer.tsx',
  'components/ProductCard.tsx',
  'components/Cart.tsx',
  'app/layout.tsx'
]

essentialComponents.forEach(comp => {
  const compPath = path.join(process.cwd(), comp)
  if (fs.existsSync(compPath)) {
    console.log(`  ✅ ${comp}`)
  } else {
    results.components.issues.push(`Composant manquant: ${comp}`)
    console.log(`  ❌ ${comp} - MANQUANT`)
  }
})

// 5. Vérifier la sécurité
console.log('\n🔒 PHASE 5: VÉRIFICATION DE LA SÉCURITÉ')
console.log('-'.repeat(70))

const securityFiles = [
  'middleware.ts',
  'lib/security.ts',
  'lib/admin-auth.ts',
  '.gitignore'
]

securityFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
    
    // Vérifier le contenu pour la sécurité
    if (file === 'middleware.ts') {
      const content = fs.readFileSync(filePath, 'utf-8')
      if (!content.includes('Strict-Transport-Security')) {
        results.security.issues.push('HSTS header manquant dans middleware')
        console.log(`  ⚠️  ${file} - HSTS manquant`)
      }
    }
  } else {
    results.security.issues.push(`Fichier sécurité manquant: ${file}`)
    console.log(`  ❌ ${file} - MANQUANT`)
  }
})

// 6. Vérifier la configuration
console.log('\n⚙️  PHASE 6: VÉRIFICATION DE LA CONFIGURATION')
console.log('-'.repeat(70))

const configFiles = {
  'next.config.mjs': ['reactStrictMode', 'compress'],
  'tsconfig.json': ['strict', 'noEmit'],
  '.eslintrc.json': ['rules']
}

Object.entries(configFiles).forEach(([file, requiredKeys]) => {
  const filePath = path.join(process.cwd(), file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const hasAllKeys = requiredKeys.every(key => content.includes(key))
    
    if (hasAllKeys) {
      console.log(`  ✅ ${file}`)
    } else {
      results.config.issues.push(`Configuration incomplète: ${file}`)
      console.log(`  ⚠️  ${file} - Configuration incomplète`)
    }
  } else {
    results.config.issues.push(`Fichier config manquant: ${file}`)
    console.log(`  ❌ ${file} - MANQUANT`)
  }
})

// Résumé
console.log('\n' + '='.repeat(70))
console.log('📊 RÉSUMÉ DE LA VÉRIFICATION')
console.log('='.repeat(70))

const totalIssues = 
  results.structure.issues.length +
  results.api.issues.length +
  results.database.issues.length +
  results.components.issues.length +
  results.security.issues.length +
  results.config.issues.length

console.log(`\n⚠️  Problèmes identifiés: ${totalIssues}`)
console.log(`\nDétails:`)
console.log(`  - Structure: ${results.structure.issues.length}`)
console.log(`  - API: ${results.api.issues.length}`)
console.log(`  - Base de données: ${results.database.issues.length}`)
console.log(`  - Composants: ${results.components.issues.length}`)
console.log(`  - Sécurité: ${results.security.issues.length}`)
console.log(`  - Configuration: ${results.config.issues.length}`)

// Calculer le pourcentage
const maxIssues = 30
const quality = Math.max(0, 100 - (totalIssues / maxIssues * 100))
console.log(`\n🎯 Qualité du projet: ${quality.toFixed(1)}%`)

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_VERIFICATION_FULLSTACK.md')
const reportContent = `# 📊 RAPPORT - VÉRIFICATION FULL STACK

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Qualité:** **${quality.toFixed(1)}%**

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Structure (${results.structure.issues.length})
${results.structure.issues.length > 0 ? results.structure.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### API Routes (${results.api.issues.length})
${results.api.issues.length > 0 ? results.api.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Base de données (${results.database.issues.length})
${results.database.issues.length > 0 ? results.database.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Composants (${results.components.issues.length})
${results.components.issues.length > 0 ? results.components.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Sécurité (${results.security.issues.length})
${results.security.issues.length > 0 ? results.security.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Configuration (${results.config.issues.length})
${results.config.issues.length > 0 ? results.config.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`)

// Retourner le code de sortie
process.exit(totalIssues > 0 ? 1 : 0)

