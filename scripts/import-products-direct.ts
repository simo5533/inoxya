#!/usr/bin/env tsx

/**
 * Script pour importer directement les produits depuis les images
 * Utilise better-sqlite3 directement
 */

import Database from 'better-sqlite3'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')
const productsDir = join(process.cwd(), 'public', 'images', 'products')
const packsDir = join(process.cwd(), 'public', 'images', 'packs')

if (!existsSync(dbPath)) {
  console.error('❌ Base de données non trouvée:', dbPath)
  process.exit(1)
}

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

function extractProductName(filename: string): string {
  const name = filename
    .replace(/-main\.(jpeg|jpg|png|webp)/i, '')
    .replace(/-secondary-\d+\.(jpeg|jpg|png|webp)/i, '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  return name
}

function detectCategory(name: string): string {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('gourmette')) return 'Bracelets'
  if (lowerName.includes('bague')) return 'Bagues'
  return 'Bagues'
}

async function importProducts() {
  console.log('🔍 Scan des images...\n')

  // Scanner les produits
  if (!existsSync(productsDir)) {
    console.error('❌ Dossier products non trouvé')
    return
  }

  const files = readdirSync(productsDir)
  const productsMap = new Map<string, { name: string; main: string; secondary: string[]; category: string }>()

  files.forEach(file => {
    const match = file.match(/^(.+?)-(main|secondary-\d+)\.(jpeg|jpg|png|webp)$/i)
    if (!match) return

    const baseName = match[1]
    const type = match[2]
    
    if (!baseName || !type) return

    const imagePath = `/images/products/${file}`

    if (!productsMap.has(baseName)) {
      productsMap.set(baseName, {
        name: extractProductName(baseName),
        main: '',
        secondary: [],
        category: detectCategory(baseName)
      })
    }

    const product = productsMap.get(baseName)!
    if (type === 'main') {
      product.main = imagePath
    } else if (type.startsWith('secondary')) {
      product.secondary.push(imagePath)
    }
  })

  const products = Array.from(productsMap.values()).filter(p => p.main !== '')
  console.log(`📦 ${products.length} produit(s) trouvé(s)\n`)

  // Insérer les produits
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, original_price, category, 
      image_url, images, is_active, is_featured, stock,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let added = 0
  for (const product of products) {
    try {
      const categoryName = product.category
      const price = Math.floor(Math.random() * 1800) + 200
      const originalPrice = price + Math.floor(Math.random() * 500) + 100
      const imagesJson = JSON.stringify([product.main, ...product.secondary])

      insertProduct.run(
        product.name,
        `Magnifique ${product.name.toLowerCase()} en acier inoxydable de qualité supérieure.`,
        price,
        originalPrice,
        categoryName,
        product.main,
        imagesJson,
        1, // is_active
        added < 9 ? 1 : 0, // Les 9 premiers sont vedettes
        10, // stock
        new Date().toISOString(),
        new Date().toISOString()
      )

      added++
      console.log(`   ✅ ${product.name} (${categoryName}) - ${price} MAD`)
    } catch (error: any) {
      console.error(`   ❌ Erreur pour ${product.name}:`, error.message)
    }
  }

  // Scanner et insérer les packs
  if (existsSync(packsDir)) {
    const packFiles = readdirSync(packsDir)
    const insertPack = db.prepare(`
      INSERT INTO packs (
        name, slug, description, price, image_url, is_featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    let packAdded = 0
    for (const file of packFiles) {
      if (file.includes('.')) {
        const match = file.match(/^pack-(.+)\.(jpg|jpeg|png|webp)$/i)
        if (match) {
          const slug = match[1]
          if (!slug) continue
          const name = slug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          try {
            const price = Math.floor(Math.random() * 1000) + 500
            insertPack.run(
              `Pack ${name}`,
              `pack-${slug}`,
              `Pack exclusif ${name.toLowerCase()} avec plusieurs bijoux coordonnés.`,
              price,
              `/images/packs/${file}`,
              packAdded < 3 ? 1 : 0,
              new Date().toISOString()
            )
            packAdded++
            console.log(`   ✅ Pack ${name} - ${price} MAD`)
          } catch (error: any) {
            console.error(`   ❌ Erreur pour pack ${name}:`, error.message)
          }
        }
      } else {
        // Dossier de pack
        const mainImage = join(packsDir, file, 'main.jpg')
        if (existsSync(mainImage)) {
          const name = file
            .replace('pack-', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
          
          try {
            const price = Math.floor(Math.random() * 1000) + 500
            insertPack.run(
              `Pack ${name}`,
              file,
              `Pack exclusif ${name.toLowerCase()} avec plusieurs bijoux coordonnés.`,
              price,
              `/images/packs/${file}/main.jpg`,
              packAdded < 3 ? 1 : 0,
              new Date().toISOString()
            )
            packAdded++
            console.log(`   ✅ Pack ${name} - ${price} MAD`)
          } catch (error: any) {
            console.error(`   ❌ Erreur pour pack ${name}:`, error.message)
          }
        }
      }
    }
  }

  // Statistiques
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
  const totalFeatured = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_featured = 1').get() as { count: number }
  const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }

  console.log('\n📊 Résumé:')
  console.log(`   ✅ Produits ajoutés: ${added}`)
  console.log(`   ✅ Total produits actifs: ${totalProducts.count}`)
  console.log(`   ✅ Produits vedettes: ${totalFeatured.count}`)
  console.log(`   ✅ Total packs: ${totalPacks.count}`)

  console.log('\n🎉 Import terminé!')
  db.close()
}

importProducts().catch(console.error)

