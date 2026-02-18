/**
 * Script de vérification complète du projet
 * Teste tous les aspects critiques avant le déploiement
 *
 * Usage: npx tsx scripts/full-verification.ts
 */

import Database from 'better-sqlite3'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const projectRoot = process.cwd()
const dbPath = join(projectRoot, 'data', 'inoxya_bijoux.db')

interface VerificationResult {
  category: string
  test: string
  status: '✅' | '❌' | '⚠️'
  message: string
}

const results: VerificationResult[] = []

console.log('🔍 VÉRIFICATION COMPLÈTE DU PROJET INOXYA BIJOUX\n')
console.log('=' .repeat(60) + '\n')

// ==================== 1. STRUCTURE DU PROJET ====================
console.log('📁 1. Vérification de la structure du projet...\n')

const criticalFiles = [
  { path: 'package.json', name: 'package.json' },
  { path: 'next.config.mjs', name: 'next.config.mjs' },
  { path: 'tsconfig.json', name: 'tsconfig.json' },
  { path: 'app/layout.tsx', name: 'Layout principal' },
  { path: 'app/page.tsx', name: 'Page d\'accueil' },
  { path: 'middleware.ts', name: 'Middleware' },
  { path: 'lib/database.ts', name: 'Couche base de données' },
  { path: 'lib/sqlite.ts', name: 'Module SQLite' },
  { path: 'lib/security.ts', name: 'Module sécurité' },
  { path: 'lib/auth.ts', name: 'Module authentification' },
  { path: 'app/api/auth/me/route.ts', name: 'API route /api/auth/me' },
]

criticalFiles.forEach(({ path, name }) => {
  const exists = existsSync(join(projectRoot, path))
  results.push({
    category: 'Structure',
    test: name,
    status: exists ? '✅' : '❌',
    message: exists ? 'Présent' : 'MANQUANT'
  })
})

// ==================== 2. BASE DE DONNÉES ====================
console.log('🗄️  2. Vérification de la base de données...\n')

if (existsSync(dbPath)) {
  try {
    const db = new Database(dbPath)
    
    // Vérifier les tables
    const tables = ['products', 'packs', 'categories', 'users', 'orders', 'order_items', 'payments', 'cart_items', 'favorites']
    tables.forEach(table => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
        results.push({
          category: 'Base de données',
          test: `Table ${table}`,
          status: '✅',
          message: `${count.count} ligne(s)`
        })
      } catch (e) {
        results.push({
          category: 'Base de données',
          test: `Table ${table}`,
          status: '❌',
          message: 'Erreur: ' + (e instanceof Error ? e.message : String(e))
        })
      }
    })
    
    // Statistiques
    const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    const packs = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
    const categories = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }
    const users = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
    
    results.push({
      category: 'Base de données',
      test: 'Statistiques',
      status: '✅',
      message: `${products.count} produits, ${packs.count} packs, ${categories.count} catégories, ${users.count} utilisateurs`
    })
    
    db.close()
  } catch (e) {
    results.push({
      category: 'Base de données',
      test: 'Connexion',
      status: '❌',
      message: 'Erreur: ' + (e instanceof Error ? e.message : String(e))
    })
  }
} else {
  results.push({
    category: 'Base de données',
    test: 'Fichier DB',
    status: '❌',
    message: 'Base de données non trouvée'
  })
}

// ==================== 3. IMAGES ====================
console.log('🖼️  3. Vérification des images...\n')

const publicDir = join(projectRoot, 'public')
const imagesDir = join(publicDir, 'images')

if (existsSync(imagesDir)) {
  try {
    const imageFiles = readdirSync(imagesDir, { recursive: true }).filter(f => 
      /\.(jpg|jpeg|png|webp|svg)$/i.test(String(f))
    )
    results.push({
      category: 'Images',
      test: 'Images dans public/images',
      status: '✅',
      message: `${imageFiles.length} fichier(s) trouvé(s)`
    })
  } catch (e) {
    results.push({
      category: 'Images',
      test: 'Dossier images',
      status: '⚠️',
      message: 'Impossible de lire le dossier'
    })
  }
} else {
  results.push({
    category: 'Images',
    test: 'Dossier images',
    status: '⚠️',
    message: 'Dossier public/images non trouvé'
  })
}

const placeholderExists = existsSync(join(publicDir, 'placeholder.svg'))
results.push({
  category: 'Images',
  test: 'Placeholder',
  status: placeholderExists ? '✅' : '⚠️',
  message: placeholderExists ? 'Présent' : 'Manquant'
})

// ==================== 4. CONFIGURATION ====================
console.log('⚙️  4. Vérification de la configuration...\n')

const envExampleExists = existsSync(join(projectRoot, 'env.example'))
results.push({
  category: 'Configuration',
  test: 'env.example',
  status: envExampleExists ? '✅' : '⚠️',
  message: envExampleExists ? 'Présent' : 'Manquant'
})

// ==================== 5. DOCUMENTATION ====================
console.log('📚 5. Vérification de la documentation...\n')

const docs = [
  'README.md',
  'README_DEPLOY.md',
  'docs/VERIFICATION_REPORT.md',
  'docs/RELEASE_CHECKLIST.md',
  'docs/MANUAL_TESTING_GUIDE.md',
  'docs/PHASES_4_5_6_VERIFICATION.md',
  'docs/RESUME_FINAL.md',
]

docs.forEach(doc => {
  const exists = existsSync(join(projectRoot, doc))
  results.push({
    category: 'Documentation',
    test: doc,
    status: exists ? '✅' : '⚠️',
    message: exists ? 'Présent' : 'Manquant'
  })
})

// ==================== 6. RÉSUMÉ ====================
console.log('\n' + '='.repeat(60))
console.log('📊 RÉSUMÉ DES VÉRIFICATIONS\n')

const byCategory = new Map<string, VerificationResult[]>()
results.forEach(r => {
  if (!byCategory.has(r.category)) {
    byCategory.set(r.category, [])
  }
  byCategory.get(r.category)!.push(r)
})

for (const [category, tests] of byCategory) {
  console.log(`\n📋 ${category}:`)
  tests.forEach(test => {
    console.log(`   ${test.status} ${test.test}: ${test.message}`)
  })
}

const passed = results.filter(r => r.status === '✅').length
const failed = results.filter(r => r.status === '❌').length
const warnings = results.filter(r => r.status === '⚠️').length

console.log('\n' + '='.repeat(60))
console.log('\n📈 STATISTIQUES FINALES:\n')
console.log(`   ✅ Réussis: ${passed}`)
console.log(`   ❌ Échecs: ${failed}`)
console.log(`   ⚠️  Avertissements: ${warnings}`)
console.log(`   📊 Total: ${results.length}`)

console.log('\n' + '='.repeat(60))

if (failed > 0) {
  console.log('\n❌ Des vérifications critiques ont échoué.')
  console.log('   Corrigez les problèmes avant de continuer.\n')
  process.exit(1)
} else {
  console.log('\n✅ Toutes les vérifications critiques sont passées!')
  if (warnings > 0) {
    console.log('   ⚠️  Des avertissements ont été détectés (non bloquants).\n')
  } else {
    console.log('   🎉 Aucun problème détecté!\n')
  }
  process.exit(0)
}

