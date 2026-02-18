/**
 * Analyse complète des pages admin et de leur sécurité
 */

const fs = require('fs')
const path = require('path')

const results = {
  pages: { client: [], server: [], unprotected: [], protected: [] },
  api: { routes: [], unprotected: [], protected: [] },
  database: { queries: [], issues: [] },
  security: { issues: [], recommendations: [] }
}

console.log('🔍 Analyse complète des pages admin...\n')

// 1. Analyser toutes les pages admin
const adminDir = path.join(process.cwd(), 'app', 'admin')

function findAdminPages(dir, basePath = '') {
  const pages = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relativePath = path.join(basePath, entry.name)
    
    if (entry.isDirectory()) {
      pages.push(...findAdminPages(fullPath, relativePath))
    } else if (entry.name === 'page.tsx') {
      pages.push({
        path: relativePath,
        fullPath: fullPath
      })
    }
  }
  
  return pages
}

const adminPages = findAdminPages(adminDir)

console.log('📄 PAGES ADMIN')
console.log('='.repeat(60))

// Vérifier si le layout admin protège toutes les pages
const layoutPath = path.join(adminDir, 'layout.tsx')
let layoutProtects = false
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8')
  layoutProtects = layoutContent.includes('requireAdmin') || layoutContent.includes('getCurrentUser')
  if (layoutProtects) {
    console.log('  ✅ Layout admin protège toutes les pages')
  }
}

adminPages.forEach(page => {
  const content = fs.readFileSync(page.fullPath, 'utf-8')
  const isClient = content.includes('"use client"')
  const hasRequireAdmin = content.includes('requireAdmin') || content.includes('getCurrentUser')
  const hasRedirect = content.includes('redirect') && content.includes('login')
  const isProtected = layoutProtects || hasRequireAdmin || hasRedirect
  
  if (isClient) {
    results.pages.client.push(page.path)
    console.log(`  ⚠️  ${page.path} - CLIENT COMPONENT`)
    if (isProtected) {
      results.pages.protected.push(page.path)
      console.log(`     ✅ PROTÉGÉE (via layout)`)
    } else {
      results.pages.unprotected.push(page.path)
      console.log(`     ❌ NON PROTÉGÉE`)
    }
  } else {
    results.pages.server.push(page.path)
    console.log(`  ✅ ${page.path} - SERVER COMPONENT`)
    if (isProtected) {
      results.pages.protected.push(page.path)
      console.log(`     ✅ PROTÉGÉE`)
    } else {
      results.pages.unprotected.push(page.path)
      console.log(`     ❌ NON PROTÉGÉE`)
    }
  }
})

// 2. Analyser les routes API admin
const apiAdminDir = path.join(process.cwd(), 'app', 'api', 'admin')

console.log('\n🔌 ROUTES API ADMIN')
console.log('='.repeat(60))

if (fs.existsSync(apiAdminDir)) {
  function findApiRoutes(dir, basePath = '') {
    const routes = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(basePath, entry.name)
      
      if (entry.isDirectory()) {
        routes.push(...findApiRoutes(fullPath, relativePath))
      } else if (entry.name === 'route.ts') {
        routes.push({
          path: `/api/admin${relativePath.replace(/\\/g, '/').replace(/\/route\.ts$/, '')}`,
          fullPath: fullPath
        })
      }
    }
    
    return routes
  }
  
  const apiRoutes = findApiRoutes(apiAdminDir)
  
  apiRoutes.forEach(route => {
    const content = fs.readFileSync(route.fullPath, 'utf-8')
    const hasAuth = content.includes('getCurrentUser') || content.includes('requireAdmin')
    const checksRole = content.includes('role') && content.includes('admin')
    
    results.api.routes.push(route.path)
    
    if (hasAuth && checksRole) {
      results.api.protected.push(route.path)
      console.log(`  ✅ ${route.path} - PROTÉGÉE`)
    } else {
      results.api.unprotected.push(route.path)
      console.log(`  ❌ ${route.path} - NON PROTÉGÉE`)
    }
  })
} else {
  console.log('  ⚠️  Dossier api/admin non trouvé')
}

// 3. Vérifier la base de données
console.log('\n💾 BASE DE DONNÉES')
console.log('='.repeat(60))

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`  ✅ Base de données trouvée (${sizeMB} MB)`)
  
  // Vérifier les fichiers de requêtes
  const libDir = path.join(process.cwd(), 'lib')
  if (fs.existsSync(libDir)) {
    const dbFiles = ['database-adapter.ts', 'sqlite.ts', 'database.ts']
    dbFiles.forEach(file => {
      const filePath = path.join(libDir, file)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const hasSQLInjectionProtection = content.includes('?') && content.includes('prepare')
        if (!hasSQLInjectionProtection && content.includes('SELECT')) {
          results.database.issues.push(`${file}: Requêtes potentiellement non sécurisées`)
        }
      }
    })
  }
} else {
  console.log('  ⚠️  Base de données non trouvée')
  results.database.issues.push('Base de données non trouvée')
}

// 4. Recommandations de sécurité
console.log('\n🔒 SÉCURITÉ')
console.log('='.repeat(60))

if (results.pages.unprotected.length > 0) {
  console.log(`  ❌ ${results.pages.unprotected.length} pages non protégées`)
  results.security.issues.push(`${results.pages.unprotected.length} pages admin non protégées`)
}

if (results.api.unprotected.length > 0) {
  console.log(`  ❌ ${results.api.unprotected.length} routes API non protégées`)
  results.security.issues.push(`${results.api.unprotected.length} routes API non protégées`)
}

if (results.pages.client.length > 0) {
  console.log(`  ⚠️  ${results.pages.client.length} pages en client component`)
  results.security.recommendations.push(`Convertir ${results.pages.client.length} pages en server components`)
}

// Résumé
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ')
console.log('='.repeat(60))
console.log(`\nPages admin: ${adminPages.length}`)
console.log(`  - Server components: ${results.pages.server.length}`)
console.log(`  - Client components: ${results.pages.client.length}`)
console.log(`  - Protégées: ${results.pages.protected.length}`)
console.log(`  - Non protégées: ${results.pages.unprotected.length}`)

console.log(`\nRoutes API: ${results.api.routes.length}`)
console.log(`  - Protégées: ${results.api.protected.length}`)
console.log(`  - Non protégées: ${results.api.unprotected.length}`)

console.log(`\nProblèmes de sécurité: ${results.security.issues.length}`)
console.log(`Recommandations: ${results.security.recommendations.length}`)

// Calculer le pourcentage
const totalPages = adminPages.length
const protectedPages = results.pages.protected.length
const totalApi = results.api.routes.length
const protectedApi = results.api.protected.length

const pageSecurity = totalPages > 0 ? (protectedPages / totalPages) * 100 : 0
const apiSecurity = totalApi > 0 ? (protectedApi / totalApi) * 100 : 0
const overallSecurity = totalPages + totalApi > 0 
  ? ((protectedPages + protectedApi) / (totalPages + totalApi)) * 100 
  : 0

console.log(`\n🎯 SÉCURITÉ GLOBALE: ${overallSecurity.toFixed(1)}%`)
console.log(`  - Pages: ${pageSecurity.toFixed(1)}%`)
console.log(`  - API: ${apiSecurity.toFixed(1)}%`)

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_ANALYSE_ADMIN.md')
const reportContent = `# 📊 RAPPORT D'ANALYSE - PAGES ADMIN

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Sécurité globale:** **${overallSecurity.toFixed(1)}%**

---

## 📄 PAGES ADMIN

### Statistiques
- **Total:** ${totalPages} pages
- **Server components:** ${results.pages.server.length}
- **Client components:** ${results.pages.client.length}
- **Protégées:** ${protectedPages}
- **Non protégées:** ${results.pages.unprotected.length}

### Pages Non Protégées
${results.pages.unprotected.length > 0 
  ? results.pages.unprotected.map(p => `- ❌ ${p}`).join('\n')
  : '- Aucune ✅'}

### Pages Client Component (à convertir)
${results.pages.client.length > 0 
  ? results.pages.client.map(p => `- ⚠️  ${p}`).join('\n')
  : '- Aucune ✅'}

---

## 🔌 ROUTES API ADMIN

### Statistiques
- **Total:** ${totalApi} routes
- **Protégées:** ${protectedApi}
- **Non protégées:** ${results.api.unprotected.length}

### Routes Non Protégées
${results.api.unprotected.length > 0 
  ? results.api.unprotected.map(r => `- ❌ ${r}`).join('\n')
  : '- Aucune ✅'}

---

## 🔒 SÉCURITÉ

### Problèmes Identifiés
${results.security.issues.length > 0 
  ? results.security.issues.map(i => `- ⚠️ ${i}`).join('\n')
  : '- Aucun ✅'}

### Recommandations
${results.security.recommendations.map(r => `- 💡 ${r}`).join('\n')}

---

## 📊 SCORE DÉTAILLÉ

| Catégorie | Score | État |
|-----------|-------|------|
| **Pages Protégées** | ${pageSecurity.toFixed(1)}% | ${pageSecurity === 100 ? '✅' : '⚠️'} |
| **API Protégées** | ${apiSecurity.toFixed(1)}% | ${apiSecurity === 100 ? '✅' : '⚠️'} |
| **Sécurité Globale** | ${overallSecurity.toFixed(1)}% | ${overallSecurity === 100 ? '✅' : '⚠️'} |

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`)

process.exit(0)

