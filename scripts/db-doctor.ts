#!/usr/bin/env tsx
/**
 * PHASE E: Script "anti-régression" pour diagnostiquer la DB
 * Affiche: cwd, chemin DB absolu, existence, taille, comptage produits/packs
 */

import path from 'path'
import fs from 'fs'

// Fonction pour obtenir le chemin DB (même logique que lib/sqlite.ts)
function getDbPath(): string {
  const envDbPath = process.env['SQLITE_DB_PATH']
  if (envDbPath) {
    return path.isAbsolute(envDbPath) ? envDbPath : path.resolve(process.cwd(), envDbPath)
  }
  return path.join(process.cwd(), 'data', 'inoxya_bijoux.db')
}

async function main() {
  console.log('🔍 DB DOCTOR - Diagnostic de la base de données\n')
  
  // 1. Informations de base
  const cwd = process.cwd()
  console.log(`📁 process.cwd(): ${cwd}`)
  
  // 2. Chemin DB
  const dbPath = getDbPath()
  const absDbPath = path.resolve(dbPath)
  console.log(`\n💾 Chemin DB:`)
  console.log(`   Relatif: ${dbPath}`)
  console.log(`   Absolu:  ${absDbPath}`)
  
  // 3. Existence et taille
  const exists = fs.existsSync(absDbPath)
  const size = exists ? fs.statSync(absDbPath).size : 0
  console.log(`\n📊 Statut:`)
  console.log(`   Existe: ${exists ? '✅ OUI' : '❌ NON'}`)
  console.log(`   Taille: ${size} bytes (${(size / 1024).toFixed(2)} KB)`)
  
  // 4. Comptage (si DB existe)
  if (exists) {
    try {
      const Database = require('better-sqlite3')
      const db = new Database(absDbPath)
      
      // Compter produits
      const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
      console.log(`\n📦 Produits:`)
      console.log(`   Actifs: ${productCount.count}`)
      
      // Compter packs
      const packCount = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
      console.log(`\n📦 Packs:`)
      console.log(`   Total: ${packCount.count}`)
      
      // Échantillon de 3 produits
      const sampleProducts = db.prepare('SELECT id, name, category FROM products WHERE is_active = 1 LIMIT 3').all() as { id: number; name: string; category?: string }[]
      if (sampleProducts.length > 0) {
        console.log(`\n📋 Échantillon produits (3 premiers):`)
        sampleProducts.forEach((p, i) => {
          console.log(`   ${i + 1}. ID ${p.id}: ${p.name} (cat: ${p.category || 'N/A'})`)
        })
      }
      
      // Échantillon de 3 packs
      const samplePacks = db.prepare('SELECT id, name FROM packs LIMIT 3').all() as { id: number; name: string }[]
      if (samplePacks.length > 0) {
        console.log(`\n📋 Échantillon packs (3 premiers):`)
        samplePacks.forEach((p, i) => {
          console.log(`   ${i + 1}. ID ${p.id}: ${p.name}`)
        })
      }
      
      db.close()
    } catch (error) {
      console.error(`\n❌ Erreur lors de la lecture de la DB:`, error)
    }
  } else {
    console.log(`\n⚠️  Base de données non trouvée. Elle sera créée au premier démarrage.`)
  }
  
  console.log(`\n✅ Diagnostic terminé\n`)
}

main().catch(console.error)

