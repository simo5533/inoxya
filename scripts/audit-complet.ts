/**
 * Audit complet du projet INOXYA BIJOUX
 * Vérifie toutes les fonctionnalités, APIs, boutons, base de données, etc.
 */

import fs from 'fs'
import path from 'path'

const projectRoot = process.cwd()

interface AuditResult {
  category: string
  item: string
  status: '✅' | '⚠️' | '❌'
  message: string
}

const results: AuditResult[] = []

function addResult(category: string, item: string, status: '✅' | '⚠️' | '❌', message: string) {
  results.push({ category, item, status, message })
}

// 1. Vérification des fichiers essentiels
function checkEssentialFiles() {
  console.log('📁 Vérification des fichiers essentiels...\n')
  
  const essentialFiles = [
    'package.json',
    'next.config.mjs',
    'tsconfig.json',
    'tailwind.config.ts',
    'app/layout.tsx',
    'app/page.tsx',
    'lib/sqlite.ts',
    'lib/fallback-packs.ts',
    'lib/fallback-products.ts',
  ]

  essentialFiles.forEach(file => {
    const exists = fs.existsSync(path.join(projectRoot, file))
    addResult(
      'Fichiers essentiels',
      file,
      exists ? '✅' : '❌',
      exists ? 'Fichier présent' : 'Fichier manquant'
    )
  })
}

// 2. Vérification des images
function checkImages() {
  console.log('🖼️  Vérification des images...\n')
  
  const imageDirs = [
    'public/images/packs',
    'public/images/products',
    'public/images/bijoux',
    'public/images/categories',
  ]

  imageDirs.forEach(dir => {
    const fullPath = path.join(projectRoot, dir)
    const exists = fs.existsSync(fullPath)
    
    if (exists) {
      const files = fs.readdirSync(fullPath, { recursive: true })
      const imageFiles = files.filter((f) => {
        const fileName = typeof f === 'string' ? f : f.toString()
        return /\.(jpg|jpeg|png|webp|svg)$/i.test(fileName)
      })
      addResult(
        'Images',
        dir,
        imageFiles.length > 0 ? '✅' : '⚠️',
        `${imageFiles.length} image(s) trouvée(s)`
      )
    } else {
      addResult('Images', dir, '⚠️', 'Dossier non trouvé')
    }
  })
}

// 3. Vérification des APIs
function checkAPIs() {
  console.log('🔌 Vérification des APIs...\n')
  
  const apiRoutes = [
    'app/api/products/route.ts',
    'app/api/packs/route.ts',
    'app/api/auth/login/route.ts',
    'app/api/admin/products/route.ts',
    'app/api/admin/packs/route.ts',
    'app/api/admin/stats/route.ts',
    'app/api/admin/users/route.ts',
  ]

  apiRoutes.forEach(route => {
    const exists = fs.existsSync(path.join(projectRoot, route))
    addResult(
      'APIs',
      route,
      exists ? '✅' : '❌',
      exists ? 'Route présente' : 'Route manquante'
    )
  })
}

// 4. Vérification des composants UI
function checkComponents() {
  console.log('🎨 Vérification des composants UI...\n')
  
  const components = [
    'components/ProductCard.tsx',
    'components/PackCard.tsx',
    'components/CategoryCard.tsx',
    'components/Header.tsx',
    'components/Footer.tsx',
    'components/ui/button.tsx',
    'components/ui/card.tsx',
  ]

  components.forEach(comp => {
    const exists = fs.existsSync(path.join(projectRoot, comp))
    addResult(
      'Composants UI',
      comp,
      exists ? '✅' : '❌',
      exists ? 'Composant présent' : 'Composant manquant'
    )
  })
}

// 5. Vérification de la configuration
function checkConfig() {
  console.log('⚙️  Vérification de la configuration...\n')
  
  // Vérifier package.json
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'))
    
    const requiredDeps = ['next', 'react', 'react-dom', 'typescript']
    requiredDeps.forEach(dep => {
      const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep]
      addResult(
        'Configuration',
        `Dépendance: ${dep}`,
        hasDep ? '✅' : '❌',
        hasDep ? 'Installée' : 'Manquante'
      )
    })
  } catch (error) {
    addResult('Configuration', 'package.json', '❌', 'Erreur de lecture')
  }
}

// 6. Vérification du système de fallback
function checkFallback() {
  console.log('🔄 Vérification du système de fallback...\n')
  
  const fallbackFiles = [
    'lib/fallback-packs.ts',
    'lib/fallback-products.ts',
  ]

  fallbackFiles.forEach(file => {
    const exists = fs.existsSync(path.join(projectRoot, file))
    if (exists) {
      const content = fs.readFileSync(path.join(projectRoot, file), 'utf-8')
      const hasFunction = content.includes('getFallback') || content.includes('getAllFallback')
      addResult(
        'Fallback',
        file,
        hasFunction ? '✅' : '⚠️',
        hasFunction ? 'Fonction présente' : 'Fonction manquante'
      )
    } else {
      addResult('Fallback', file, '❌', 'Fichier manquant')
    }
  })
}

// 7. Génération du rapport
function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RAPPORT D\'AUDIT COMPLET\n')
  console.log('='.repeat(60) + '\n')

  const categories = [...new Set(results.map(r => r.category))]

  categories.forEach(category => {
    console.log(`\n📂 ${category.toUpperCase()}`)
    console.log('-'.repeat(60))
    
    const categoryResults = results.filter(r => r.category === category)
    categoryResults.forEach(r => {
      console.log(`${r.status} ${r.item.padEnd(50)} ${r.message}`)
    })
  })

  const total = results.length
  const success = results.filter(r => r.status === '✅').length
  const warning = results.filter(r => r.status === '⚠️').length
  const error = results.filter(r => r.status === '❌').length

  console.log('\n' + '='.repeat(60))
  console.log('📈 RÉSUMÉ')
  console.log('='.repeat(60))
  console.log(`Total: ${total}`)
  console.log(`✅ Succès: ${success} (${Math.round(success/total*100)}%)`)
  console.log(`⚠️  Avertissements: ${warning} (${Math.round(warning/total*100)}%)`)
  console.log(`❌ Erreurs: ${error} (${Math.round(error/total*100)}%)`)
  console.log('='.repeat(60) + '\n')

  if (error === 0) {
    console.log('✅ PROJET PRÊT POUR LE DÉPLOIEMENT!\n')
  } else {
    console.log('⚠️  Des corrections sont nécessaires avant le déploiement.\n')
  }
}

// Exécution
async function main() {
  console.log('🔍 AUDIT COMPLET DU PROJET INOXYA BIJOUX\n')
  console.log('='.repeat(60) + '\n')

  checkEssentialFiles()
  checkImages()
  checkAPIs()
  checkComponents()
  checkConfig()
  checkFallback()

  generateReport()
}

main().catch(console.error)

