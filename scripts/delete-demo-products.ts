/**
 * Script pour supprimer les produits de démonstration de la base de données
 * 
 * Usage:
 *   Dry-run (par défaut): npx tsx scripts/delete-demo-products.ts
 *   Exécution: npx tsx scripts/delete-demo-products.ts --execute
 */

import Database from 'better-sqlite3'
import { existsSync, copyFileSync } from 'fs'
import { join } from 'path'

type DatabaseType = InstanceType<typeof Database>

const projectRoot = process.cwd()
const dbPath = join(projectRoot, 'data', 'inoxya_bijoux.db')
const isDryRun = !process.argv.includes('--execute')

// Produits de démonstration à supprimer (noms exacts ou variations)
const demoProductNames = [
  'Bague Berbère Or 18K',
  'Bague Solitaire Premium',
  'Bague Vintage Art Deco',
  'Collier Filigrane Argent',
  'Collier Pendentif Lune',
  'Bracelet Khomsa Protection',
]

interface ProductMatch {
  id: number
  name: string
  category: string | null
  image_url: string | null
  matchScore: number
}

/**
 * Normalise un nom pour la comparaison (supprime accents, ponctuation, espaces)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9]/g, '') // Supprime tout sauf lettres et chiffres
}

/**
 * Calcule un score de correspondance entre deux noms
 */
function matchScore(target: string, candidate: string): number {
  const normalizedTarget = normalizeName(target)
  const normalizedCandidate = normalizeName(candidate)
  
  if (normalizedTarget === normalizedCandidate) return 100
  if (normalizedCandidate.includes(normalizedTarget)) return 80
  if (normalizedTarget.includes(normalizedCandidate)) return 80
  
  // Calcul simple de similarité
  let matches = 0
  for (let i = 0; i < Math.min(normalizedTarget.length, normalizedCandidate.length); i++) {
    if (normalizedTarget[i] === normalizedCandidate[i]) matches++
  }
  return (matches / Math.max(normalizedTarget.length, normalizedCandidate.length)) * 100
}

/**
 * Trouve les produits correspondants aux noms de démonstration
 */
function findMatchingProducts(db: DatabaseType): ProductMatch[] {
  const allProducts = db.prepare('SELECT id, name, category, image_url FROM products').all() as Array<{
    id: number
    name: string
    category: string | null
    image_url: string | null
  }>

  const matches: ProductMatch[] = []

  for (const demoName of demoProductNames) {
    let bestMatch: ProductMatch | null = null
    let bestScore = 0

    for (const product of allProducts) {
      const score = matchScore(demoName, product.name)
      if (score > bestScore && score >= 70) { // Seuil de 70% pour considérer une correspondance
        bestScore = score
        bestMatch = {
          id: product.id,
          name: product.name,
          category: product.category,
          image_url: product.image_url,
          matchScore: score,
        }
      }
    }

    if (bestMatch) {
      matches.push(bestMatch)
    }
  }

  return matches
}

/**
 * Crée un backup de la base de données
 */
function createBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = join(projectRoot, 'data', `inoxya_bijoux.backup.${timestamp}.db`)
  
  if (!existsSync(dbPath)) {
    throw new Error(`Base de données non trouvée: ${dbPath}`)
  }
  
  copyFileSync(dbPath, backupPath)
  return backupPath
}

/**
 * Supprime les produits et leurs références
 */
function deleteProducts(db: DatabaseType, productIds: number[]): void {
  if (productIds.length === 0) {
    console.log('⚠️  Aucun produit à supprimer.')
    return
  }

  const placeholders = productIds.map(() => '?').join(',')

  // Supprimer les références dans favorites
  const deletedFavorites = db.prepare(`DELETE FROM favorites WHERE bijou_id IN (${placeholders})`).run(...productIds)
  console.log(`   ✅ ${deletedFavorites.changes} référence(s) supprimée(s) dans favorites`)

  // Supprimer les références dans cart_items
  const deletedCart = db.prepare(`DELETE FROM cart_items WHERE bijou_id IN (${placeholders})`).run(...productIds)
  console.log(`   ✅ ${deletedCart.changes} référence(s) supprimée(s) dans cart_items`)

  // Supprimer les références dans order_items
  const deletedOrderItems = db.prepare(`DELETE FROM order_items WHERE bijou_id IN (${placeholders})`).run(...productIds)
  console.log(`   ✅ ${deletedOrderItems.changes} référence(s) supprimée(s) dans order_items`)

  // Supprimer les produits
  const deletedProducts = db.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).run(...productIds)
  console.log(`   ✅ ${deletedProducts.changes} produit(s) supprimé(s)`)
}

/**
 * Vérifie que les produits ont été supprimés
 */
function verifyDeletion(db: DatabaseType, productIds: number[]): boolean {
  const placeholders = productIds.map(() => '?').join(',')
  const remaining = db.prepare(`SELECT COUNT(*) as count FROM products WHERE id IN (${placeholders})`).get(...productIds) as { count: number }
  
  return remaining.count === 0
}

// ==================== EXÉCUTION ====================

async function main() {
  console.log('🔍 Suppression des produits de démonstration\n')
  console.log('=' .repeat(60) + '\n')

  if (isDryRun) {
    console.log('⚠️  MODE DRY-RUN (aucune modification ne sera effectuée)\n')
    console.log('   Pour exécuter la suppression, utilisez: --execute\n')
  } else {
    console.log('🚨 MODE EXÉCUTION - Les produits seront supprimés définitivement!\n')
  }

  // Vérifier que la base de données existe
  if (!existsSync(dbPath)) {
    console.error(`❌ Base de données non trouvée: ${dbPath}`)
    console.error('💡 Exécutez d\'abord: npm run db:seed')
    process.exit(1)
  }

  const db = new Database(dbPath)
  db.pragma('foreign_keys = ON')

  try {
    // STEP 1: Trouver les correspondances
    console.log('📋 STEP 1 — Recherche des produits correspondants...\n')
    
    const matches = findMatchingProducts(db)
    
    if (matches.length === 0) {
      console.log('✅ Aucun produit de démonstration trouvé dans la base de données.\n')
      db.close()
      process.exit(0)
    }

    console.log(`📊 ${matches.length} produit(s) trouvé(s):\n`)
    console.log('ID  | Nom                              | Catégorie        | Image')
    console.log('-'.repeat(80))
    
    matches.forEach(m => {
      const name = m.name.padEnd(30)
      const category = (m.category || 'N/A').padEnd(15)
      const image = m.image_url ? '✅' : '❌'
      console.log(`${String(m.id).padStart(3)} | ${name} | ${category} | ${image}`)
    })
    
    console.log()

    if (isDryRun) {
      console.log('✅ DRY-RUN terminé. Aucune modification effectuée.\n')
      console.log('💡 Pour exécuter la suppression, utilisez:')
      console.log('   npx tsx scripts/delete-demo-products.ts --execute\n')
      db.close()
      process.exit(0)
    }

    // STEP 0: Backup (avant suppression)
    console.log('💾 STEP 0 — Création du backup...\n')
    const backupPath = createBackup()
    console.log(`✅ Backup créé: ${backupPath}\n`)

    // STEP 2: Suppression
    console.log('🗑️  STEP 2 — Suppression des produits et références...\n')
    
    const productIds = matches.map(m => m.id)
    deleteProducts(db, productIds)
    
    console.log()

    // STEP 3: Vérification
    console.log('✅ STEP 3 — Vérification...\n')
    
    const verified = verifyDeletion(db, productIds)
    if (verified) {
      console.log('✅ Tous les produits de démonstration ont été supprimés avec succès.\n')
    } else {
      console.error('❌ Erreur: Certains produits n\'ont pas été supprimés.\n')
      console.error('💡 Restaurez le backup si nécessaire.\n')
      db.close()
      process.exit(1)
    }

    // Vérifier le nombre total de produits restants
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').get() as { count: number }
    console.log(`📊 Produits restants: ${totalProducts.count} (tous actifs)\n`)

    // Vérifier les packs (ne doivent pas être affectés)
    const totalPacks = db.prepare('SELECT COUNT(*) as count FROM packs').get() as { count: number }
    console.log(`📦 Packs: ${totalPacks.count} (non affectés)\n`)

    console.log('=' .repeat(60))
    console.log('\n✅ Suppression terminée avec succès!\n')
    console.log(`💾 Backup disponible: ${backupPath}\n`)

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    if (!isDryRun) {
      console.error('\n💡 Restaurez le backup si nécessaire.\n')
    }
    db.close()
    process.exit(1)
  } finally {
    db.close()
  }
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error)
  process.exit(1)
})

