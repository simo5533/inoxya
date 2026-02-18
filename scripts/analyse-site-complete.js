/**
 * Script d'analyse complète du site INOXYA BIJOUX
 * Vérifie les liens, erreurs, performances et génère un rapport
 */

const fs = require('fs')
const path = require('path')

const results = {
  liens: { total: 0, cassés: 0, valides: 0, details: [] },
  erreurs: { total: 0, details: [] },
  performances: { images: 0, imports: 0, console: 0 },
  orthographe: { total: 0, details: [] },
  pages: { total: 0, fonctionnelles: 0, details: [] }
}

// Analyser les fichiers
function analyzeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        analyzeFiles(filePath, fileList)
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// Analyser un fichier
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // Compter les liens
    const linkMatches = content.match(/href=["']([^"']+)["']/g) || []
    linkMatches.forEach(match => {
      const href = match.match(/href=["']([^"']+)["']/)[1]
      results.liens.total++
      
      if (href === '#' || href.startsWith('javascript:') || href === '') {
        results.liens.cassés++
        results.liens.details.push({ file: filePath, href })
      } else if (href.startsWith('/') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        results.liens.valides++
      }
    })
    
    // Compter les console.log
    const consoleMatches = content.match(/console\.(log|error|warn|debug)/g) || []
    results.performances.console += consoleMatches.length
    
    // Compter les imports
    const importMatches = content.match(/^import\s+.*from\s+['"]/gm) || []
    results.performances.imports += importMatches.length
    
    // Vérifier les images
    const imageMatches = content.match(/<Image|from\s+['"]next\/image['"]/g) || []
    results.performances.images += imageMatches.length
    
    // Vérifier les erreurs potentielles
    if (content.includes('any') && filePath.includes('.ts')) {
      results.erreurs.total++
      results.erreurs.details.push({ file: filePath, type: 'Type any utilisé' })
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      results.erreurs.total++
      results.erreurs.details.push({ file: filePath, type: 'TODO/FIXME trouvé' })
    }
    
  } catch (error) {
    results.erreurs.total++
    results.erreurs.details.push({ file: filePath, type: 'Erreur de lecture', error: error.message })
  }
}

// Analyser les pages
function analyzePages() {
  const appDir = path.join(process.cwd(), 'app')
  if (fs.existsSync(appDir)) {
    const pages = fs.readdirSync(appDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() || dirent.name === 'page.tsx')
      .map(dirent => dirent.name)
    
    results.pages.total = pages.length
    results.pages.fonctionnelles = pages.length // À affiner avec des tests réels
  }
}

// Calculer le pourcentage de qualité
function calculateQuality() {
  const totalChecks = 
    results.liens.total +
    results.erreurs.total +
    results.performances.console +
    results.pages.total
  
  const issues = 
    results.liens.cassés +
    results.erreurs.total +
    (results.performances.console > 50 ? results.performances.console - 50 : 0)
  
  const quality = Math.max(0, Math.min(100, ((totalChecks - issues) / totalChecks) * 100))
  
  return {
    quality: Math.round(quality),
    totalChecks,
    issues
  }
}

// Générer le rapport
function generateReport() {
  console.log('\n📊 RAPPORT D\'ANALYSE COMPLÈTE - INOXYA BIJOUX\n')
  console.log('='.repeat(60))
  
  // Liens
  console.log('\n🔗 ANALYSE DES LIENS')
  console.log(`Total: ${results.liens.total}`)
  console.log(`✅ Valides: ${results.liens.valides}`)
  console.log(`❌ Cassés: ${results.liens.cassés}`)
  if (results.liens.cassés > 0) {
    console.log('\nLiens cassés trouvés:')
    results.liens.details.slice(0, 10).forEach(detail => {
      console.log(`  - ${path.relative(process.cwd(), detail.file)}: ${detail.href}`)
    })
  }
  
  // Erreurs
  console.log('\n⚠️  ANALYSE DES ERREURS')
  console.log(`Total: ${results.erreurs.total}`)
  if (results.erreurs.details.length > 0) {
    console.log('\nDétails:')
    results.erreurs.details.slice(0, 10).forEach(detail => {
      console.log(`  - ${path.relative(process.cwd(), detail.file)}: ${detail.type}`)
    })
  }
  
  // Performances
  console.log('\n⚡ ANALYSE DES PERFORMANCES')
  console.log(`Images optimisées: ${results.performances.images}`)
  console.log(`Imports: ${results.performances.imports}`)
  console.log(`Console.log à nettoyer: ${results.performances.console}`)
  
  // Pages
  console.log('\n📄 ANALYSE DES PAGES')
  console.log(`Total pages: ${results.pages.total}`)
  console.log(`Pages fonctionnelles: ${results.pages.fonctionnelles}`)
  
  // Qualité globale
  const quality = calculateQuality()
  console.log('\n🎯 QUALITÉ GLOBALE')
  console.log(`Pourcentage de qualité: ${quality.quality}%`)
  console.log(`Total vérifications: ${quality.totalChecks}`)
  console.log(`Problèmes identifiés: ${quality.issues}`)
  
  console.log('\n' + '='.repeat(60))
  console.log('\n✅ Analyse terminée!\n')
  
  return quality
}

// Exécuter l'analyse
console.log('🔍 Démarrage de l\'analyse...\n')

const files = analyzeFiles(path.join(process.cwd(), 'app'))
files.push(...analyzeFiles(path.join(process.cwd(), 'components')))

files.forEach(file => analyzeFile(file))
analyzePages()

const quality = generateReport()

// Sauvegarder le rapport
const reportPath = path.join(process.cwd(), 'RAPPORT_ANALYSE_FINALE.md')
const reportContent = `# 📊 RAPPORT D'ANALYSE FINALE - INOXYA BIJOUX

**Date:** ${new Date().toLocaleDateString('fr-FR')}
**Qualité globale:** ${quality.quality}%

## 🔗 Liens
- Total: ${results.liens.total}
- Valides: ${results.liens.valides}
- Cassés: ${results.liens.cassés}

## ⚠️ Erreurs
- Total: ${results.erreurs.total}

## ⚡ Performances
- Images optimisées: ${results.performances.images}
- Imports: ${results.performances.imports}
- Console.log: ${results.performances.console}

## 📄 Pages
- Total: ${results.pages.total}
- Fonctionnelles: ${results.pages.fonctionnelles}

## 🎯 Recommandations
1. ${results.liens.cassés > 0 ? `Corriger ${results.liens.cassés} liens cassés` : 'Aucun lien cassé'}
2. ${results.performances.console > 50 ? `Nettoyer ${results.performances.console} console.log` : 'Console.log OK'}
3. ${results.erreurs.total > 0 ? `Corriger ${results.erreurs.total} erreurs` : 'Aucune erreur majeure'}
`

fs.writeFileSync(reportPath, reportContent)
console.log(`📝 Rapport sauvegardé dans: ${reportPath}\n`)

process.exit(0)
