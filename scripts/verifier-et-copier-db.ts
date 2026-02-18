#!/usr/bin/env ts-node

/**
 * Script pour vérifier et copier le bon fichier de base de données
 */

import * as fs from 'fs'
import * as path from 'path'

async function main() {
  const projectRoot = process.cwd()
  const targetDbPath = path.resolve(projectRoot, 'data', 'inoxya_bijoux.db')

  // Fichiers DB potentiels à vérifier
  const potentialDbFiles = [
    path.resolve(projectRoot, 'data', 'inoxya_bijoux.db'),
    path.resolve(projectRoot, 'data', 'inoxya-bijoux.db'),
    path.resolve(projectRoot, 'inoxya-bijoux 2', 'data', 'inoxya_bijoux.db'),
    path.resolve(projectRoot, '..', 'inoxya-bijoux 2', 'data', 'inoxya_bijoux.db'),
  ]

  console.log('🔍 RECHERCHE DU FICHIER DE BASE DE DONNÉES')
console.log('='.repeat(80))
console.log(`📁 Chemin cible: ${targetDbPath}`)
console.log('')

// Créer le répertoire data si nécessaire
const dataDir = path.dirname(targetDbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log(`✅ Répertoire créé: ${dataDir}`)
}

// Trouver le fichier DB avec le plus de données
let bestDb: { path: string; size: number; products: number; packs: number } | null = null

for (const dbFile of potentialDbFiles) {
  if (!fs.existsSync(dbFile)) {
    continue
  }

  const stats = fs.statSync(dbFile)
  console.log(`📄 Fichier trouvé: ${dbFile}`)
  console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`)
  console.log(`   Date: ${stats.mtime}`)

  // Essayer de lire le fichier avec sql.js pour compter les produits
  try {
    const initSqlJs = require('sql.js')
    const wasmPath = path.resolve(projectRoot, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
    
    if (!fs.existsSync(wasmPath)) {
      console.log(`   ⚠️  Fichier WASM non trouvé, impossible de vérifier le contenu`)
      continue
    }

    const SQL = await initSqlJs.default({
      locateFile: () => wasmPath
    })

    const fileBuffer = fs.readFileSync(dbFile)
    const db = new SQL.Database(fileBuffer)

    // Compter les produits
    let productsCount = 0
    let packsCount = 0

    try {
      const productsResult = db.exec('SELECT COUNT(*) as count FROM products WHERE (is_active = 1 OR is_active IS NULL)')
      if (productsResult.length > 0 && productsResult[0].values && productsResult[0].values[0]) {
        productsCount = productsResult[0].values[0][0] as number
      }
    } catch (e) {
      // Table products n'existe pas ou erreur
    }

    try {
      const packsResult = db.exec('SELECT COUNT(*) as count FROM packs')
      if (packsResult.length > 0 && packsResult[0].values && packsResult[0].values[0]) {
        packsCount = packsResult[0].values[0][0] as number
      }
    } catch (e) {
      // Table packs n'existe pas ou erreur
    }

    console.log(`   📦 Produits: ${productsCount}`)
    console.log(`   📦 Packs: ${packsCount}`)

    // Choisir le fichier avec le plus de produits
    if (!bestDb || productsCount > bestDb.products || (productsCount === bestDb.products && stats.size > bestDb.size)) {
      bestDb = {
        path: dbFile,
        size: stats.size,
        products: productsCount,
        packs: packsCount
      }
    }

    db.close()
  } catch (e: any) {
    console.log(`   ❌ Erreur lors de la lecture: ${e.message || String(e)}`)
  }

  console.log('')
}

if (!bestDb) {
  console.log('❌ Aucun fichier DB valide trouvé!')
  process.exit(1)
}

console.log('='.repeat(80))
console.log('📊 FICHIER RECOMMANDÉ')
console.log('='.repeat(80))
console.log(`📄 Chemin: ${bestDb.path}`)
console.log(`📦 Produits: ${bestDb.products}`)
console.log(`📦 Packs: ${bestDb.packs}`)
console.log(`💾 Taille: ${(bestDb.size / 1024).toFixed(2)} KB`)
console.log('')

// Vérifier si le fichier cible existe déjà
if (fs.existsSync(targetDbPath)) {
  const targetStats = fs.statSync(targetDbPath)
  console.log(`⚠️  Le fichier cible existe déjà:`)
  console.log(`   ${targetDbPath}`)
  console.log(`   Taille: ${(targetStats.size / 1024).toFixed(2)} KB`)
  console.log('')
  
  // Si le fichier recommandé est différent, proposer de le copier
  if (bestDb.path !== targetDbPath) {
    console.log(`💡 Voulez-vous copier le fichier recommandé vers la cible?`)
    console.log(`   Source: ${bestDb.path}`)
    console.log(`   Cible: ${targetDbPath}`)
    console.log('')
    console.log('   Pour copier, exécutez:')
    console.log(`   Copy-Item "${bestDb.path}" "${targetDbPath}" -Force`)
  } else {
    console.log('✅ Le fichier recommandé est déjà à la bonne place!')
  }
} else {
  // Copier le fichier recommandé vers la cible
  console.log(`📋 Copie du fichier recommandé vers la cible...`)
  try {
    fs.copyFileSync(bestDb.path, targetDbPath)
    console.log(`✅ Fichier copié avec succès!`)
    console.log(`   ${bestDb.path}`)
  } catch (e: any) {
    console.log(`❌ Erreur lors de la copie: ${e.message || String(e)}`)
    process.exit(1)
  }
}

console.log('')
console.log('✅ TERMINÉ')
console.log('')
console.log('📋 Prochaines étapes:')
console.log('   1. Redémarrez le serveur: npm run dev')
console.log('   2. Vérifiez: http://localhost:3003/api/health')
  console.log('   3. Vérifiez: http://localhost:3003/api/products')
  console.log('')
}

main().catch(console.error)

