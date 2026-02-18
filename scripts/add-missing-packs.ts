/**
 * Script pour ajouter les packs manquants (13 packs au total)
 * Usage: npx tsx scripts/add-missing-packs.ts
 */

import Database from 'better-sqlite3'
import { join } from 'path'

const dbPath = join(process.cwd(), 'data', 'inoxya_bijoux.db')

const allPacks = [
  { name: 'Pack Prestige', slug: 'pack-prestige', price: 149, original_price: 299, image_url: '/images/packs/pack-prestige.jpg', is_featured: true },
  { name: 'Pack Émeraude', slug: 'pack-emeraude', price: 219, original_price: 399, image_url: '/images/packs/pack-emeraude.jpg', is_featured: true },
  { name: 'Pack Doré Luxe', slug: 'pack-dore-luxe', price: 299, original_price: 599, image_url: '/images/packs/pack-dore-luxe.jpg', is_featured: true },
  { name: 'Pack Cloue', slug: 'pack-cloue', price: 449, original_price: 799, image_url: '/images/packs/pack-cloue.jpg', is_featured: true },
  { name: 'Pack Cloue Soft', slug: 'pack-cloue-soft', price: 599, original_price: 999, image_url: '/images/packs/pack-cloue-soft.jpg', is_featured: true },
  { name: 'Pack Élegancia', slug: 'pack-elegancia', price: 749, original_price: 1299, image_url: '/images/packs/pack-elegancia.jpg', is_featured: true },
  { name: 'Pack Éclat Suprême', slug: 'pack-eclat-supreme', price: 999, original_price: 1599, image_url: '/images/packs/pack-eclat-supreme.jpg', is_featured: true },
  { name: 'Pack Trêfle', slug: 'pack-trefle', price: 199, original_price: 349, image_url: '/images/packs/pack-trefle.jpg', is_featured: true },
  { name: 'Pack Royal', slug: 'pack-royal', price: 329, original_price: 549, image_url: '/images/packs/pack-royal.jpg', is_featured: true },
  { name: 'Pack Papillon', slug: 'pack-papillon', price: 419, original_price: 699, image_url: '/images/packs/pack-papillon.jpg', is_featured: true },
  { name: 'Pack Impérial', slug: 'pack-imperial', price: 350, original_price: 400, image_url: '/images/packs/pack-imperial.jpg', is_featured: true },
  { name: 'Pack Glamour', slug: 'pack-glamour', price: 269, original_price: 449, image_url: '/images/packs/pack-glamour.jpg', is_featured: true },
  { name: 'Pack Black Titanium', slug: 'pack-black-titanium', price: 359, original_price: 599, image_url: '/images/packs/pack-black-titanium.jpg', is_featured: true },
]

async function addMissingPacks() {
  console.log('📦 Ajout des packs manquants...\n')
  
  const db = new Database(dbPath)
  
  try {
    const insertPack = db.prepare(`
      INSERT OR IGNORE INTO packs (name, slug, description, price, image_url, is_featured, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    let added = 0
    let skipped = 0
    
    for (const pack of allPacks) {
      try {
        const result = insertPack.run(
          pack.name,
          pack.slug,
          `Collection ${pack.name} - Bijoux en acier inoxydable premium`,
          pack.price,
          pack.image_url,
          pack.is_featured ? 1 : 0,
          new Date().toISOString()
        )
        
        if (result.changes > 0) {
          console.log(`   ✅ ${pack.name} - ${pack.price} MAD`)
          added++
        } else {
          console.log(`   ⚠️  ${pack.name} existe déjà`)
          skipped++
        }
      } catch (error) {
        console.error(`   ❌ Erreur pour ${pack.name}:`, error)
      }
    }
    
    console.log(`\n📊 Résumé:`)
    console.log(`   ✅ Ajoutés: ${added}`)
    console.log(`   ⚠️  Déjà présents: ${skipped}`)
    console.log(`   📦 Total: ${allPacks.length}`)
    
    // Vérifier le total final
    const total = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
    console.log(`\n✅ Total packs dans la base: ${total.count}`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

addMissingPacks().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

