/**
 * Script de vérification et initialisation SQLite
 * Vérifie la connexion, les tables, et les données de base
 * 
 * Usage: npx tsx scripts/verify-sqlite.ts
 */

import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'
import { initializeDatabase } from '@/lib/sqlite'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')

async function verifySQLite() {
  console.log('🔍 Vérification SQLite...\n')
  
  // 1. Vérifier l'existence de la DB
  if (!existsSync(dbPath)) {
    console.log('⚠️  Base de données non trouvée, initialisation...')
    try {
      initializeDatabase()
      console.log('✅ Base de données initialisée avec succès\n')
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error)
      process.exit(1)
    }
  } else {
    console.log(`✅ Base de données trouvée: ${dbPath}\n`)
  }
  
  // 2. Vérifier la connexion
  let db: Database | null = null
  try {
    db = new Database(dbPath)
    console.log('✅ Connexion SQLite établie\n')
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    process.exit(1)
  }
  
  if (!db) {
    console.error('❌ Impossible d\'établir la connexion')
    process.exit(1)
  }
  
  try {
    // 3. Vérifier les tables principales
    console.log('📊 Vérification des tables...\n')
    
    const tables = [
      'products',
      'packs',
      'categories',
      'users',
      'orders',
      'order_items',
      'payments',
      'cart_items',
      'favorites'
    ]
    
    const existingTables: string[] = []
    const missingTables: string[] = []
    
    for (const table of tables) {
      const result = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `).get(table) as { name: string } | undefined
      
      if (result) {
        existingTables.push(table)
        // Compter les lignes
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number }
        console.log(`   ✅ ${table}: ${count.count} ligne(s)`)
      } else {
        missingTables.push(table)
        console.log(`   ❌ ${table}: Table manquante`)
      }
    }
    
    console.log()
    
    // 4. Statistiques
    console.log('📈 Statistiques:\n')
    
    const stats = {
      products: db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number },
      productsActive: db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number },
      packs: db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number },
      categories: db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number },
      users: db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number },
      orders: db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }
    }
    
    console.log(`   📦 Produits: ${stats.products.count} (${stats.productsActive.count} actifs)`)
    console.log(`   📦 Packs: ${stats.packs.count}`)
    console.log(`   📁 Catégories: ${stats.categories.count}`)
    console.log(`   👥 Utilisateurs: ${stats.users.count}`)
    console.log(`   🛒 Commandes: ${stats.orders.count}`)
    console.log()
    
    // 5. Résumé
    if (missingTables.length > 0) {
      console.log('⚠️  Tables manquantes détectées. Exécutez: npm run db:seed')
      console.log()
    }
    
    if (existingTables.length === tables.length) {
      console.log('✅ Toutes les tables sont présentes')
    }
    
    console.log('\n✅ Vérification SQLite terminée\n')
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

verifySQLite().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

