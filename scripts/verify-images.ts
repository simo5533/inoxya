/**
 * Script de vérification des images
 * Vérifie que toutes les images référencées dans la DB existent dans /public/images/
 */

import { testConnection, select } from '@/lib/sqlite'
import fs from 'fs'
import path from 'path'

interface ImageCheck {
  type: 'product' | 'pack'
  id: number
  name: string
  image_url: string
  exists: boolean
  fullPath: string
}

const missingImages: ImageCheck[] = []
const validImages: ImageCheck[] = []

function checkImage(imageUrl: string | null, type: 'product' | 'pack', id: number, name: string): boolean {
  if (!imageUrl) {
    missingImages.push({
      type,
      id,
      name,
      image_url: '',
      exists: false,
      fullPath: ''
    })
    return false
  }
  
  const publicDir = path.join(process.cwd(), 'public')
  
  // Normaliser le chemin
  let normalizedPath = imageUrl
  if (normalizedPath.startsWith('/')) {
    normalizedPath = normalizedPath.slice(1)
  }
  
  const fullPath = path.join(publicDir, normalizedPath)
  const exists = fs.existsSync(fullPath)
  
  if (exists) {
    validImages.push({ type, id, name, image_url: imageUrl, exists: true, fullPath })
    return true
  } else {
    missingImages.push({ type, id, name, image_url: imageUrl, exists: false, fullPath })
    return false
  }
}

async function main() {
  console.log('🖼️  VÉRIFICATION DES IMAGES\n')
  console.log('='.repeat(60) + '\n')
  
  if (!testConnection()) {
    console.log('❌ Base de données non accessible\n')
    process.exit(1)
  }
  
  // Vérifier les produits
  console.log('📦 Vérification des images de produits...\n')
  const products = select('SELECT id, name, image_url FROM products WHERE image_url IS NOT NULL') as Array<{
    id: number
    name: string
    image_url: string
  }>
  
  for (const product of products) {
    checkImage(product.image_url, 'product', product.id, product.name)
  }
  
  // Vérifier les packs
  console.log('📦 Vérification des images de packs...\n')
  const packs = select('SELECT id, name, image_url FROM packs WHERE image_url IS NOT NULL') as Array<{
    id: number
    name: string
    image_url: string
  }>
  
  for (const pack of packs) {
    checkImage(pack.image_url, 'pack', pack.id, pack.name)
  }
  
  // Rapport
  console.log('\n' + '='.repeat(60))
  console.log('📊 RAPPORT DE VÉRIFICATION DES IMAGES\n')
  console.log('='.repeat(60) + '\n')
  
  console.log(`✅ Images valides: ${validImages.length}`)
  console.log(`❌ Images manquantes: ${missingImages.length}\n`)
  
  if (missingImages.length > 0) {
    console.log('📋 IMAGES MANQUANTES:\n')
    missingImages.forEach(img => {
      console.log(`  ${img.type === 'product' ? '📦' : '📦'} ${img.name} (ID: ${img.id})`)
      console.log(`     Chemin attendu: ${img.image_url}`)
      console.log(`     Chemin complet: ${img.fullPath}\n`)
    })
  }
  
  if (validImages.length === validImages.length + missingImages.length && missingImages.length === 0) {
    console.log('✅ TOUTES LES IMAGES SONT PRÉSENTES!\n')
    process.exit(0)
  } else {
    console.log(`⚠️  ${missingImages.length} image(s) manquante(s) nécessitent une attention.\n`)
    process.exit(missingImages.length > 0 ? 1 : 0)
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})
