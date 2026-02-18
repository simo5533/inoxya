#!/usr/bin/env tsx

/**
 * Script pour importer les produits via l'API Next.js
 * Le serveur doit être démarré: npm run dev
 * Usage: npx tsx scripts/import-via-api.ts
 */

import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

const API_URL = process.env['API_URL'] || 'http://localhost:3000'
const productsDir = join(process.cwd(), 'public', 'images', 'products')

// Identifiants admin pour l'authentification
const ADMIN_PHONE = 'admin_phone'
const ADMIN_PASSWORD = 'Admin123!'

async function login(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: ADMIN_PHONE,
        password: ADMIN_PASSWORD
      })
    })

    if (!response.ok) {
      console.error('❌ Erreur de connexion:', await response.text())
      return null
    }

    const data = await response.json()
    return data.token || null
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error)
    return null
  }
}

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
  console.log('🔍 Scan des images de produits...\n')

  if (!existsSync(productsDir)) {
    console.error('❌ Dossier products non trouvé')
    return
  }

  // Scanner les images
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

  // Se connecter
  console.log('🔐 Connexion à l\'API...')
  const token = await login()
  if (!token) {
    console.error('❌ Impossible de se connecter. Assurez-vous que le serveur Next.js est démarré.')
    return
  }
  console.log('✅ Connecté\n')

  // Insérer les produits
  let added = 0
  let errors = 0

  for (const product of products) {
    try {
      const price = Math.floor(Math.random() * 1800) + 200
      const originalPrice = price + Math.floor(Math.random() * 500) + 100

      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: product.name,
          description: `Magnifique ${product.name.toLowerCase()} en acier inoxydable de qualité supérieure.`,
          price,
          original_price: originalPrice,
          category: product.category,
          main_image: product.main,
          images: [product.main, ...product.secondary],
          stock: 10,
          is_active: true,
          is_featured: added < 9
        })
      })

      if (response.ok) {
        added++
        console.log(`   ✅ ${product.name} (${product.category}) - ${price} MAD`)
      } else {
        const error = await response.text()
        console.error(`   ❌ Erreur pour ${product.name}:`, error)
        errors++
      }
    } catch (error: any) {
      console.error(`   ❌ Erreur pour ${product.name}:`, error.message)
      errors++
    }
  }

  console.log('\n📊 Résumé:')
  console.log(`   ✅ Produits ajoutés: ${added}`)
  console.log(`   ❌ Erreurs: ${errors}`)
  console.log('\n🎉 Import terminé!')
  console.log('💡 Rafraîchissez votre navigateur pour voir les produits.')
}

// Vérifier que le serveur est accessible
fetch(`${API_URL}/api/categories`)
  .then(() => {
    importProducts().catch(console.error)
  })
  .catch(() => {
    console.error(`❌ Le serveur Next.js n'est pas accessible sur ${API_URL}`)
    console.log('💡 Démarrez le serveur avec: npm run dev')
    process.exit(1)
  })

