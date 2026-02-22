/**
 * Script pour vérifier les produits dans la DB SQLite locale
 * Aide à savoir combien de produits migrer vers PostgreSQL
 */

import { getBetterSqlite3Db } from '../lib/sqlite'
import { getSqlJsDb } from '../lib/sqljs-singleton'

async function checkLocalProducts() {
  console.log('🔍 Vérification des produits locaux...\n')

  // Essayer better-sqlite3
  const betterSqlite3Db = getBetterSqlite3Db()
  if (betterSqlite3Db) {
    try {
      const products = betterSqlite3Db.prepare('SELECT id, name, price, category, image_url FROM products WHERE is_active = 1 LIMIT 20').all() as Array<{
        id: string | number
        name: string
        price: number
        category?: string
        image_url?: string
      }>
      
      const total = betterSqlite3Db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
      
      console.log(`✅ Base de données SQLite trouvée`)
      console.log(`📊 Total de produits actifs : ${total.count}\n`)
      
      if (products.length > 0) {
        console.log('📦 Premiers produits trouvés :')
        products.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.name} - ${p.price} MAD (${p.category || 'Sans catégorie'})`)
        })
        console.log(`\n💡 Vous avez ${total.count} produit(s) à migrer vers PostgreSQL`)
      } else {
        console.log('⚠️  Aucun produit trouvé dans la base de données locale')
        console.log('💡 Vous devrez ajouter des produits via l\'interface admin après la configuration PostgreSQL')
      }
      
      return { count: total.count, products }
    } catch (error) {
      console.error('❌ Erreur lors de la lecture SQLite:', error)
    }
  }

  // Essayer sql.js
  try {
    const sqlJsDb = await getSqlJsDb()
    const result = sqlJsDb.db.exec('SELECT COUNT(*) as count FROM products WHERE is_active = 1')
    const countVal = result[0]?.values?.[0]?.[0]
    if (countVal !== undefined) {
      const count = countVal as number
      console.log(`✅ Base de données SQLite (sql.js) trouvée`)
      console.log(`📊 Total de produits actifs : ${count}\n`)
      return { count, products: [] }
    }
  } catch (error) {
    console.log('⚠️  Base de données SQLite non trouvée ou vide')
    console.log('💡 Pas de problème - vous pourrez ajouter des produits après la configuration PostgreSQL\n')
  }

  return { count: 0, products: [] }
}

checkLocalProducts().catch(console.error)

