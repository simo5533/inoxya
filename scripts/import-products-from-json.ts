/**
 * Script pour importer les produits depuis produits-reels.json
 * Usage: npx tsx scripts/import-products-from-json.ts
 */

import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')
const jsonPath = join(process.cwd(), 'data', 'produits-reels.json')

interface ProductFromJson {
  id: number
  name: string
  name_ar: string | null
  description: string
  price: number
  original_price: number | null
  image_url: string
  images: string
  category: string
  stock: number
  is_available: number
  created_at: string
  updated_at: string
}

async function importProducts() {
  console.log('📥 Import des produits depuis produits-reels.json...\n')
  
  // Lire le fichier JSON
  let jsonData: { bijoux: ProductFromJson[] }
  try {
    const fileContent = readFileSync(jsonPath, 'utf-8')
    jsonData = JSON.parse(fileContent)
  } catch (error) {
    console.error(`❌ Erreur lors de la lecture de ${jsonPath}:`, error)
    process.exit(1)
  }
  
  const products = jsonData.bijoux || []
  console.log(`📦 ${products.length} produit(s) trouvé(s) dans le JSON\n`)
  
  const db = new Database(dbPath)
  
  try {
    // Récupérer les catégories pour mapper les noms aux IDs
    const categories = db.prepare('SELECT id, name FROM categories').all() as Array<{
      id: string
      name: string
    }>
    const categoryMap = new Map<string, string>()
    categories.forEach(cat => {
      categoryMap.set(cat.name, cat.id)
    })
    
    const insertProduct = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, name, name_ar, description, price, original_price,
        image_url, images, category, stock, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    let added = 0
    let updated = 0
    let skipped = 0
    
    for (const product of products) {
      try {
        // Trouver l'ID de la catégorie
        const categoryId = categoryMap.get(product.category) || null
        
        // Vérifier si le produit existe déjà
        const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(product.id) as { id: number } | undefined
        
        insertProduct.run(
          product.id,
          product.name,
          product.name_ar || null,
          product.description,
          product.price,
          product.original_price || null,
          product.image_url,
          product.images || '[]',
          categoryId,
          product.stock || 10,
          product.is_available ? 1 : 0,
          product.created_at,
          product.updated_at
        )
        
        if (existing) {
          updated++
          console.log(`   🔄 Mis à jour: ${product.name} (ID: ${product.id})`)
        } else {
          added++
          console.log(`   ✅ Ajouté: ${product.name} (ID: ${product.id})`)
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour ${product.name}:`, error)
        skipped++
      }
    }
    
    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ Ajoutés: ${added}`)
    console.log(`   🔄 Mis à jour: ${updated}`)
    console.log(`   ❌ Erreurs: ${skipped}`)
    console.log(`   📦 Total traité: ${products.length}`)
    
    // Vérifier le total final
    const total = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
    const active = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    
    console.log(`\n✅ Total produits dans la base: ${total.count} (${active.count} actifs)`)
    
    if (total.count >= 35) {
      console.log('✅ Import réussi!')
    } else {
      console.log(`⚠️  Attendu: ~35 produits, trouvé: ${total.count}`)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

importProducts().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

