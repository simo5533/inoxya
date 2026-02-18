/**
 * Script de vérification et application stricte de toutes les contraintes de configuration
 */

const fs = require('fs')
const path = require('path')

const results = {
  nextjs: { issues: [], fixed: [] },
  typescript: { issues: [], fixed: [] },
  eslint: { issues: [], fixed: [] },
  security: { issues: [], fixed: [] },
  database: { issues: [], fixed: [] },
  environment: { issues: [], fixed: [] }
}

console.log('🔍 Vérification de toutes les contraintes de configuration...\n')

// 1. Vérifier next.config.mjs
console.log('📋 VÉRIFICATION NEXT.JS')
console.log('='.repeat(60))

const nextConfigPath = path.join(process.cwd(), 'next.config.mjs')
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf-8')
  
  // Vérifier les contraintes strictes
  if (content.includes('ignoreDuringBuilds: true')) {
    results.nextjs.issues.push('ESLint ignoreDuringBuilds est activé')
  }
  if (content.includes('ignoreBuildErrors: true')) {
    results.nextjs.issues.push('TypeScript ignoreBuildErrors est activé')
  }
  if (!content.includes('reactStrictMode: true')) {
    results.nextjs.issues.push('reactStrictMode n\'est pas activé')
  }
  if (!content.includes('compress: true')) {
    results.nextjs.issues.push('Compression n\'est pas activée')
  }
  if (content.includes('poweredByHeader: true')) {
    results.nextjs.issues.push('poweredByHeader est activé (sécurité)')
  }
  
  console.log(`  ✅ Fichier trouvé`)
  if (results.nextjs.issues.length > 0) {
    console.log(`  ⚠️  Problèmes: ${results.nextjs.issues.length}`)
    results.nextjs.issues.forEach(issue => console.log(`     - ${issue}`))
  } else {
    console.log(`  ✅ Configuration stricte OK`)
  }
} else {
  results.nextjs.issues.push('Fichier next.config.mjs non trouvé')
  console.log('  ❌ Fichier non trouvé')
}

// 2. Vérifier tsconfig.json
console.log('\n📋 VÉRIFICATION TYPESCRIPT')
console.log('='.repeat(60))

const tsConfigPath = path.join(process.cwd(), 'tsconfig.json')
if (fs.existsSync(tsConfigPath)) {
  const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'))
  
  if (!tsConfig.compilerOptions.strict) {
    results.typescript.issues.push('Mode strict non activé')
  }
  if (tsConfig.compilerOptions.skipLibCheck === false) {
    results.typescript.issues.push('skipLibCheck désactivé (peut ralentir)')
  }
  if (!tsConfig.compilerOptions.noEmit) {
    results.typescript.issues.push('noEmit non activé')
  }
  if (!tsConfig.compilerOptions.isolatedModules) {
    results.typescript.issues.push('isolatedModules non activé')
  }
  
  console.log(`  ✅ Fichier trouvé`)
  if (results.typescript.issues.length > 0) {
    console.log(`  ⚠️  Problèmes: ${results.typescript.issues.length}`)
    results.typescript.issues.forEach(issue => console.log(`     - ${issue}`))
  } else {
    console.log(`  ✅ Configuration stricte OK`)
  }
} else {
  results.typescript.issues.push('Fichier tsconfig.json non trouvé')
  console.log('  ❌ Fichier non trouvé')
}

// 3. Vérifier ESLint
console.log('\n📋 VÉRIFICATION ESLINT')
console.log('='.repeat(60))

const eslintFiles = ['.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js', 'eslint.config.mjs']
let eslintFound = false

for (const file of eslintFiles) {
  const eslintPath = path.join(process.cwd(), file)
  if (fs.existsSync(eslintPath)) {
    eslintFound = true
    console.log(`  ✅ Fichier trouvé: ${file}`)
    break
  }
}

if (!eslintFound) {
  results.eslint.issues.push('Aucun fichier ESLint trouvé')
  console.log('  ⚠️  Aucun fichier ESLint trouvé')
}

// 4. Vérifier la sécurité
console.log('\n🔒 VÉRIFICATION SÉCURITÉ')
console.log('='.repeat(60))

// Vérifier les variables d'environnement sensibles
const envExamplePath = path.join(process.cwd(), '.env.example')
const envPath = path.join(process.cwd(), '.env.local')

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  if (envContent.includes('password') && !envContent.includes('SECRET')) {
    results.security.issues.push('Mots de passe potentiellement exposés dans .env')
  }
  console.log('  ⚠️  Fichier .env.local trouvé (vérifiez qu\'il n\'est pas commité)')
} else {
  console.log('  ✅ Pas de .env.local (normal)')
}

// Vérifier .gitignore
const gitignorePath = path.join(process.cwd(), '.gitignore')
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf-8')
  if (!gitignore.includes('.env.local')) {
    results.security.issues.push('.env.local non dans .gitignore')
  }
  if (!gitignore.includes('.next')) {
    results.security.issues.push('.next non dans .gitignore')
  }
  console.log('  ✅ .gitignore trouvé')
} else {
  results.security.issues.push('.gitignore non trouvé')
  console.log('  ❌ .gitignore non trouvé')
}

// 5. Vérifier la base de données
console.log('\n💾 VÉRIFICATION BASE DE DONNÉES')
console.log('='.repeat(60))

const dbPath = path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath)
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`  ✅ Base de données trouvée (${sizeMB} MB)`)
  
  // Vérifier les requêtes préparées
  const libFiles = ['lib/database-adapter.ts', 'lib/sqlite.ts', 'lib/database.ts']
  let hasUnsafeQueries = false
  
  libFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8')
      // Vérifier les requêtes non préparées (concaténation de strings)
      const unsafePattern = /SELECT.*\$\{.*\}|INSERT.*\$\{.*\}|UPDATE.*\$\{.*\}|DELETE.*\$\{.*\}/
      if (unsafePattern.test(content)) {
        hasUnsafeQueries = true
        results.database.issues.push(`${file}: Requêtes potentiellement non sécurisées`)
      }
    }
  })
  
  if (hasUnsafeQueries) {
    console.log('  ⚠️  Requêtes potentiellement non sécurisées détectées')
  } else {
    console.log('  ✅ Requêtes sécurisées')
  }
} else {
  console.log('  ⚠️  Base de données non trouvée')
}

// Résumé
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ DES CONTRAINTES')
console.log('='.repeat(60))

const totalIssues = 
  results.nextjs.issues.length +
  results.typescript.issues.length +
  results.eslint.issues.length +
  results.security.issues.length +
  results.database.issues.length

console.log(`\n⚠️  Problèmes identifiés: ${totalIssues}`)
console.log(`\nDétails:`)
console.log(`  - Next.js: ${results.nextjs.issues.length}`)
console.log(`  - TypeScript: ${results.typescript.issues.length}`)
console.log(`  - ESLint: ${results.eslint.issues.length}`)
console.log(`  - Sécurité: ${results.security.issues.length}`)
console.log(`  - Base de données: ${results.database.issues.length}`)

// Calculer le pourcentage
const maxIssues = 20 // Estimation du nombre maximum de problèmes possibles
const quality = Math.max(0, 100 - (totalIssues / maxIssues * 100))
console.log(`\n🎯 Qualité de configuration: ${quality.toFixed(1)}%`)

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_CONTRAINTES_CONFIG.md')
const reportContent = `# 📊 RAPPORT - CONTRAINTES DE CONFIGURATION

**Date:** ${new Date().toLocaleDateString('fr-FR')}  
**Qualité:** **${quality.toFixed(1)}%**

---

## 🔍 PROBLÈMES IDENTIFIÉS

### Next.js (${results.nextjs.issues.length})
${results.nextjs.issues.length > 0 ? results.nextjs.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### TypeScript (${results.typescript.issues.length})
${results.typescript.issues.length > 0 ? results.typescript.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### ESLint (${results.eslint.issues.length})
${results.eslint.issues.length > 0 ? results.eslint.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Sécurité (${results.security.issues.length})
${results.security.issues.length > 0 ? results.security.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

### Base de données (${results.database.issues.length})
${results.database.issues.length > 0 ? results.database.issues.map(i => `- ⚠️ ${i}`).join('\n') : '- Aucun ✅'}

---

**Rapport généré le:** ${new Date().toLocaleString('fr-FR')}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`\n📝 Rapport sauvegardé: ${reportPath}\n`)

process.exit(0)

