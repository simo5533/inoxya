#!/usr/bin/env tsx

/**
 * Script pour créer automatiquement les produits depuis les images existantes
 * Usage: npx tsx scripts/create-products-from-images.ts
 */

import { initializeDatabase, select, execute } from '../lib/sqlite'
import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const productsDir = join(process.cwd(), 'public', 'images', 'products')
const packsDir = join(process.cwd(), 'public', 'images', 'packs')

interface ImageInfo {
  name: string
  main: string
  secondary: string[]
  category: string
}

function extractProductName(filename: string): string {
  // Exemple: "bague-brillante-main.jpeg" -> "Bague Brillante"
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
  if (lowerName.includes('bague') || lowerName.includes('ring')) return 'Bagues'
  if (lowerName.includes('gourmette') || lowerName.includes('bracelet')) return 'Bracelets'
  if (lowerName.includes('collier') || lowerName.includes('necklace')) return 'Colliers'
  if (lowerName.includes('boucle') || lowerName.includes('earring')) return 'Boucles d\'oreilles'
  if (lowerName.includes('parure') || lowerName.includes('set')) return 'Parures'
  if (lowerName.includes('broche') || lowerName.includes('brooch')) return 'Broches'
  return 'Bagues' // Par défaut
}

function scanProductsImages(): ImageInfo[] {
  if (!existsSync(productsDir)) {
    console.log('❌ Dossier products non trouvé:', productsDir)
    return []
  }

  const files = readdirSync(productsDir)
  const productsMap = new Map<string, ImageInfo>()

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

  return Array.from(productsMap.values()).filter(p => p.main !== '')
}

function scanPacksImages(): Array<{ name: string; image: string; slug: string }> {
  if (!existsSync(packsDir)) {
    console.log('❌ Dossier packs non trouvé:', packsDir)
    return []
  }

  const files = readdirSync(packsDir)
  const packs: Array<{ name: string; image: string; slug: string }> = []

  files.forEach(file => {
    // Ignorer les dossiers (packs avec plusieurs images)
    if (file.includes('.')) {
      const match = file.match(/^pack-(.+)\.(jpg|jpeg|png|webp)$/i)
      if (match) {
        const slug = match[1]
        if (!slug) return
        const name = slug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        packs.push({
          name: `Pack ${name}`,
          image: `/images/packs/${file}`,
          slug: `pack-${slug}`
        })
      }
    } else {
      // Dossier de pack (ex: pack-elegance-berbere)
      const mainImage = join(packsDir, file, 'main.jpg')
      if (existsSync(mainImage)) {
        const name = file
          .replace('pack-', '')
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        packs.push({
          name: `Pack ${name}`,
          image: `/images/packs/${file}/main.jpg`,
          slug: file
        })
      }
    }
  })

  return packs
}

async function createProductsFromImages() {
  console.log('🔍 Scan des images de produits...\n')

  // Initialiser la base de données
  initializeDatabase()

  // Scanner les images
  const products = scanProductsImages()
  const packs = scanPacksImages()

  console.log(`📦 ${products.length} produit(s) trouvé(s) dans les images`)
  console.log(`📦 ${packs.length} pack(s) trouvé(s) dans les images\n`)

  if (products.length === 0 && packs.length === 0) {
    console.log('❌ Aucune image trouvée')
    return
  }

  // Récupérer les catégories
  const categories = select('SELECT id, name FROM categories') as Array<{ id: number; name: string }>
  const categoryMap = new Map(categories.map(c => [c.name, c.id]))

  let productsAdded = 0
  let packsAdded = 0

  // Créer les produits
  if (products.length > 0) {
    console.log('📦 Création des produits...\n')
    
    for (const product of products) {
      try {
        const categoryId = categoryMap.get(product.category) || categories[0]?.id || 1
        const categoryName = categories.find(c => c.id === categoryId)?.name || 'Bagues'
        
        // Prix aléatoire entre 200 et 2000 MAD
        const price = Math.floor(Math.random() * 1800) + 200
        const originalPrice = price + Math.floor(Math.random() * 500) + 100

        const imagesJson = JSON.stringify([product.main, ...product.secondary])

        execute(`
          INSERT INTO products (
            name, description, price, original_price, category, 
            image_url, images, is_active, is_featured, stock,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.name,
          `Magnifique ${product.name.toLowerCase()} en acier inoxydable de qualité supérieure.`,
          price,
          originalPrice,
          categoryName,
          product.main,
          imagesJson,
          1, // is_active
          productsAdded < 9 ? 1 : 0, // Les 9 premiers sont vedettes
          10, // stock
          new Date().toISOString(),
          new Date().toISOString()
        ])

        productsAdded++
        console.log(`   ✅ ${product.name} (${categoryName}) - ${price} MAD`)
      } catch (error) {
        console.error(`   ❌ Erreur pour ${product.name}:`, error)
      }
    }
  }

  // Créer les packs
  if (packs.length > 0) {
    console.log('\n📦 Création des packs...\n')
    
    for (const pack of packs) {
      try {
        const price = Math.floor(Math.random() * 1000) + 500

        execute(`
          INSERT INTO packs (
            name, slug, description, price, image_url, is_featured,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          pack.name,
          pack.slug,
          `Pack exclusif ${pack.name.toLowerCase()} avec plusieurs bijoux coordonnés.`,
          price,
          pack.image,
          packsAdded < 3 ? 1 : 0, // Les 3 premiers sont vedettes
          new Date().toISOString()
        ])

        packsAdded++
        console.log(`   ✅ ${pack.name} - ${price} MAD`)
      } catch (error) {
        console.error(`   ❌ Erreur pour ${pack.name}:`, error)
      }
    }
  }

  // Statistiques finales
  const totalProducts = select('SELECT COUNT(*) as count FROM products WHERE is_active = 1') as Array<{ count: number }>
  const totalFeatured = select('SELECT COUNT(*) as count FROM products WHERE is_featured = 1') as Array<{ count: number }>
  const totalPacks = select('SELECT COUNT(*) as count FROM packs') as Array<{ count: number }>

  console.log('\n📊 Résumé:')
  console.log(`   ✅ Produits créés: ${productsAdded}`)
  console.log(`   ✅ Packs créés: ${packsAdded}`)
  console.log(`\n📦 Total dans la base:`)
  console.log(`   - Produits actifs: ${totalProducts[0]?.count || 0}`)
  console.log(`   - Produits vedettes: ${totalFeatured[0]?.count || 0}`)
  console.log(`   - Packs: ${totalPacks[0]?.count || 0}`)

  console.log('\n🎉 Import terminé avec succès!')
  console.log('💡 Rafraîchissez votre navigateur pour voir les produits.')
}

createProductsFromImages().catch(console.error)

