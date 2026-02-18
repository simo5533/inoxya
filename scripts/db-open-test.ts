/**
 * PHASE 2: Script de test pour ouvrir la DB et vérifier les tables/comptes
 * Utilise le même helper que l'application
 */

import { getDbPath, testConnection, select, initializeDatabase } from '../lib/sqlite'
import path from 'path'
import fs from 'fs'

async function main() {
  console.log('\n=== PHASE 2: TEST D\'OUVERTURE DE LA BASE DE DONNÉES ===\n')
  
  try {
    // 1. Afficher le chemin absolu utilisé
    const dbPath = getDbPath()
    const absDbPath = path.resolve(dbPath)
    console.log(`📁 Chemin DB résolu: ${absDbPath}`)
    console.log(`📁 Chemin DB (relatif): ${dbPath}`)
    console.log(`📁 CWD: ${process.cwd()}`)
    console.log(`📁 Existe: ${fs.existsSync(absDbPath)}`)
    
    if (fs.existsSync(absDbPath)) {
      const stats = fs.statSync(absDbPath)
      console.log(`📁 Taille: ${stats.size} bytes (${(stats.size / 1024).toFixed(2)} KB)`)
    }
    
    // 2. Tester la connexion
    console.log('\n🔌 Test de connexion...')
    const isConnected = testConnection()
    console.log(`   Résultat: ${isConnected ? '✅ Connecté' : '❌ Non connecté'}`)
    
    if (!isConnected) {
      console.error('\n❌ ERREUR: Impossible de se connecter à la base de données')
      console.error('   Vérifiez les logs ci-dessus pour les détails de l\'erreur')
      process.exit(1)
    }
    
    // 3. Initialiser la DB si nécessaire
    console.log('\n🔧 Initialisation de la base de données...')
    try {
      initializeDatabase()
      console.log('   ✅ Base de données initialisée')
    } catch (error: any) {
      console.error('   ⚠️  Erreur lors de l\'initialisation:', error?.message || String(error))
    }
    
    // 4. Lister les tables
    console.log('\n📋 Tables dans la base de données:')
    try {
      const tables = select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", []) as Array<{ name: string }>
      if (tables.length === 0) {
        console.log('   ⚠️  Aucune table trouvée')
      } else {
        tables.forEach(table => {
          console.log(`   - ${table.name}`)
        })
      }
    } catch (error: any) {
      console.error('   ❌ Erreur lors de la liste des tables:', error?.message || String(error))
      process.exit(1)
    }
    
    // 5. Compter les produits
    console.log('\n📦 Comptage des produits:')
    try {
      const productsResult = select('SELECT COUNT(*) AS c FROM products', []) as Array<{ c: number }>
      const productsCount = productsResult[0]?.c || 0
      console.log(`   ✅ Produits: ${productsCount}`)
      
      if (productsCount > 0) {
        // Afficher quelques exemples
        const samples = select('SELECT id, name, price, category FROM products LIMIT 3', []) as Array<{ id: number; name: string; price: number; category: string }>
        console.log('   Exemples:')
        samples.forEach(p => {
          console.log(`     - ID ${p.id}: ${p.name} (${p.price}€, ${p.category})`)
        })
      }
    } catch (error: any) {
      console.error('   ❌ Erreur lors du comptage des produits:', error?.message || String(error))
      process.exit(1)
    }
    
    // 6. Compter les packs
    console.log('\n📦 Comptage des packs:')
    try {
      const packsResult = select('SELECT COUNT(*) AS c FROM packs', []) as Array<{ c: number }>
      const packsCount = packsResult[0]?.c || 0
      console.log(`   ✅ Packs: ${packsCount}`)
      
      if (packsCount > 0) {
        // Afficher quelques exemples
        const samples = select('SELECT id, name, price FROM packs LIMIT 3', []) as Array<{ id: number; name: string; price: number }>
        console.log('   Exemples:')
        samples.forEach(p => {
          console.log(`     - ID ${p.id}: ${p.name} (${p.price}€)`)
        })
      }
    } catch (error: any) {
      console.error('   ❌ Erreur lors du comptage des packs:', error?.message || String(error))
      process.exit(1)
    }
    
    console.log('\n✅ TEST RÉUSSI: La base de données est accessible et contient des données\n')
    
  } catch (error: any) {
    console.error('\n❌ ERREUR FATALE:', error?.message || String(error))
    if (error?.stack) {
      console.error('\nStack trace:')
      console.error(error.stack)
    }
    process.exit(1)
  }
}

main().catch(console.error)

