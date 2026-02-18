/**
 * Script de vérification complète du projet INOXYA BIJOUX
 * Vérifie que tout fonctionne correctement avant le déploiement
 *
 * Usage: npx tsx scripts/verify-project.ts
 */

import { existsSync } from 'fs'
import { join } from 'path'

const projectRoot = process.cwd()

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

const checks: CheckResult[] = []

console.log('🔍 Vérification complète du projet INOXYA BIJOUX...\n')

// 1. Vérifier la structure du projet
console.log('📁 Vérification de la structure...')

const requiredFiles = [
  'package.json',
  'next.config.mjs',
  'tsconfig.json',
  'app/layout.tsx',
  'app/page.tsx',
  'lib/database.ts',
  'lib/sqlite.ts',
  'middleware.ts',
]

requiredFiles.forEach(file => {
  const exists = existsSync(join(projectRoot, file))
  checks.push({
    name: `Fichier ${file}`,
    status: exists ? 'pass' : 'fail',
    message: exists ? 'Présent' : 'MANQUANT'
  })
})

// 2. Vérifier la base de données
console.log('🗄️  Vérification de la base de données...')

const dbPath = join(projectRoot, 'data', 'inoxya_bijoux.db')
const dbExists = existsSync(dbPath)
checks.push({
  name: 'Base de données SQLite',
  status: dbExists ? 'pass' : 'fail',
  message: dbExists ? 'Présente' : 'MANQUANTE - Exécutez: npm run db:seed'
})

// 3. Vérifier les images
console.log('🖼️  Vérification des images...')

const publicDir = join(projectRoot, 'public')
const imagesDir = join(publicDir, 'images')
const placeholderExists = existsSync(join(publicDir, 'placeholder.svg'))

checks.push({
  name: 'Dossier public/images',
  status: existsSync(imagesDir) ? 'pass' : 'warning',
  message: existsSync(imagesDir) ? 'Présent' : 'Manquant (peut être normal)'
})

checks.push({
  name: 'Placeholder image',
  status: placeholderExists ? 'pass' : 'warning',
  message: placeholderExists ? 'Présent' : 'Manquant'
})

// 4. Vérifier les variables d'environnement
console.log('⚙️  Vérification de la configuration...')

const envExampleExists = existsSync(join(projectRoot, 'env.example'))
checks.push({
  name: 'env.example',
  status: envExampleExists ? 'pass' : 'warning',
  message: envExampleExists ? 'Présent' : 'Manquant'
})

// 5. Vérifier les documents
console.log('📚 Vérification de la documentation...')

const requiredDocs = [
  'README.md',
  'README_DEPLOY.md',
  'docs/VERIFICATION_REPORT.md',
  'docs/RELEASE_CHECKLIST.md',
  'docs/MANUAL_TESTING_GUIDE.md',
]

requiredDocs.forEach(doc => {
  const exists = existsSync(join(projectRoot, doc))
  checks.push({
    name: `Documentation ${doc}`,
    status: exists ? 'pass' : 'warning',
    message: exists ? 'Présent' : 'Manquant'
  })
})

// 6. Résumé
console.log('\n📊 Résumé des vérifications:\n')

const passed = checks.filter(c => c.status === 'pass').length
const failed = checks.filter(c => c.status === 'fail').length
const warnings = checks.filter(c => c.status === 'warning').length

checks.forEach(check => {
  const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${check.name}: ${check.message}`)
})

console.log('\n📈 Statistiques:')
console.log(`   ✅ Réussis: ${passed}`)
console.log(`   ❌ Échecs: ${failed}`)
console.log(`   ⚠️  Avertissements: ${warnings}`)

if (failed > 0) {
  console.log('\n❌ Des vérifications ont échoué. Corrigez les problèmes avant de continuer.\n')
  process.exit(1)
} else if (warnings > 0) {
  console.log('\n⚠️  Des avertissements ont été détectés. Vérifiez-les si nécessaire.\n')
  process.exit(0)
} else {
  console.log('\n✅ Toutes les vérifications sont passées avec succès!\n')
  process.exit(0)
}

